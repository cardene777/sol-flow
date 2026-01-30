import { parse } from '@solidity-parser/parser';
import type {
  ContractDefinition,
  FunctionDefinition,
  EventDefinition as ASTEventDefinition,
  CustomErrorDefinition,
  UsingForDeclaration,
  ImportDirective,
} from '@solidity-parser/parser/dist/src/ast-types';
import type {
  Contract,
  ContractKind,
  ContractCategory,
  ExternalFunction,
  InternalFunction,
  Parameter,
  ReturnValue,
  FunctionCall,
  EventDefinition,
  ErrorDefinition,
  StructDefinition,
  ImportInfo,
  StateVariable,
} from '@/types/callGraph';

interface ParsedFile {
  contracts: Contract[];
  sourceCode: string;
}

// Parse import statements
function parseImports(ast: { children: any[] }, currentFilePath: string): ImportInfo[] {
  const imports: ImportInfo[] = [];

  for (const node of ast.children) {
    if (node.type === 'ImportDirective') {
      const importNode = node as ImportDirective;
      const importPath = importNode.path;
      const isExternal = importPath.startsWith('@') || importPath.startsWith('hardhat/') || importPath.startsWith('forge-std/');

      // Handle different import styles
      if (importNode.symbolAliases && importNode.symbolAliases.length > 0) {
        // Named imports: import {Name} from "path" or import {Name as Alias} from "path"
        for (const symbolAlias of importNode.symbolAliases) {
          const name = symbolAlias[0];
          const alias = symbolAlias[1] || undefined;
          imports.push({
            name,
            alias,
            path: importPath,
            isExternal,
          });
        }
      } else if (importNode.unitAlias) {
        // Namespace import: import * as Name from "path" or import "path" as Name
        imports.push({
          name: importNode.unitAlias,
          path: importPath,
          isExternal,
        });
      } else {
        // Bare import: import "path" - extract name from path
        const fileName = importPath.split('/').pop()?.replace('.sol', '') || importPath;
        imports.push({
          name: fileName,
          path: importPath,
          isExternal,
        });
      }
    }
  }

  return imports;
}

// Parse a single Solidity file
export function parseSolidityFile(filePath: string, content: string): ParsedFile {
  const contracts: Contract[] = [];

  try {
    const ast = parse(content, {
      tolerant: true,
      loc: true,
      range: true,
    });

    // Parse imports first (file-level)
    const fileImports = parseImports(ast, filePath);

    for (const node of ast.children) {
      if (node.type === 'ContractDefinition') {
        const contract = parseContractDefinition(node as ContractDefinition, content, filePath, fileImports);
        contracts.push(contract);
      }
    }
  } catch {
    // Failed to parse file - skip silently
  }

  return { contracts, sourceCode: content };
}

function parseContractDefinition(
  node: ContractDefinition,
  sourceCode: string,
  filePath: string,
  fileImports: ImportInfo[]
): Contract {
  const kind: ContractKind = node.kind as ContractKind;
  const name = node.name;

  // Extract inheritance
  const inherits: string[] = [];
  const implements_: string[] = [];

  for (const base of node.baseContracts) {
    const baseName = base.baseName.namePath;
    // Heuristic: interfaces start with 'I' and second char is uppercase
    if (baseName.startsWith('I') && baseName[1] === baseName[1]?.toUpperCase()) {
      implements_.push(baseName);
    } else {
      inherits.push(baseName);
    }
  }

  const externalFunctions: ExternalFunction[] = [];
  const internalFunctions: InternalFunction[] = [];
  const events: EventDefinition[] = [];
  const errors: ErrorDefinition[] = [];
  const structs: StructDefinition[] = [];
  const usesLibraries: string[] = [];
  const stateVariables: StateVariable[] = [];

  // First pass: collect state variables to build type map
  const variableTypeMap = new Map<string, string>();

  for (const subNode of node.subNodes) {
    if (subNode.type === 'StateVariableDeclaration') {
      const varNode = subNode as any;
      for (const variable of varNode.variables || []) {
        const varName = variable.name;
        const varType = getTypeName(variable.typeName);
        const visibility = variable.visibility || 'internal';
        const isConstant = variable.isDeclaredConst || false;
        const isImmutable = variable.isImmutable || false;

        variableTypeMap.set(varName, varType);

        stateVariables.push({
          name: varName,
          type: varType,
          visibility: visibility as 'public' | 'private' | 'internal',
          isConstant,
          isImmutable,
        });
      }
    }
  }

  // Second pass: process functions with variable type information
  for (const subNode of node.subNodes) {
    if (subNode.type === 'FunctionDefinition') {
      const func = parseFunctionDefinition(subNode as FunctionDefinition, sourceCode, variableTypeMap);
      if (func) {
        if (func.visibility === 'external' || func.visibility === 'public') {
          externalFunctions.push(func as ExternalFunction);
        } else {
          internalFunctions.push(func as InternalFunction);
        }
      }
    } else if (subNode.type === 'EventDefinition') {
      events.push(parseEventDefinition(subNode as ASTEventDefinition));
    } else if (subNode.type === 'CustomErrorDefinition') {
      errors.push(parseErrorDefinition(subNode as CustomErrorDefinition));
    } else if (subNode.type === 'StructDefinition') {
      structs.push(parseStructDefinition(subNode as any));
    } else if (subNode.type === 'UsingForDeclaration') {
      const usingNode = subNode as UsingForDeclaration;
      if (usingNode.libraryName) {
        usesLibraries.push(usingNode.libraryName);
      }
    }
  }

  return {
    name,
    kind,
    category: determineCategory(name, inherits, kind, filePath),
    filePath,
    inherits,
    implements: implements_,
    usesLibraries,
    imports: fileImports, // Include parsed imports
    externalFunctions,
    internalFunctions,
    events,
    errors,
    structs,
    stateVariables,
    sourceCode, // Full file content including comments and imports
  };
}

function parseFunctionDefinition(
  node: FunctionDefinition,
  sourceCode: string,
  variableTypeMap: Map<string, string> = new Map()
): ExternalFunction | InternalFunction | null {
  // Skip constructors, fallbacks, receives
  if (!node.name || node.isConstructor || node.isFallback || node.isReceiveEther) {
    return null;
  }

  const visibility = node.visibility || 'public';
  const stateMutability = node.stateMutability || 'nonpayable';

  const parameters: Parameter[] = node.parameters.map((p) => ({
    name: p.name || '',
    type: getTypeName(p.typeName),
  }));

  const returnValues: ReturnValue[] = (node.returnParameters || []).map((p) => ({
    name: p.name || '',
    type: getTypeName(p.typeName),
  }));

  // Extract function body source code
  let sourceCodeStr = '';
  let startLine = 1;

  if (node.loc) {
    startLine = node.loc.start.line;
    if (node.range) {
      sourceCodeStr = sourceCode.slice(node.range[0], node.range[1] + 1);
    }
  }

  // Extract function calls and emits from body
  const calls: FunctionCall[] = [];
  const emits: string[] = [];
  const modifiers: string[] = [];

  // Build local variable type map (includes parameters and local declarations)
  const localVariableTypeMap = new Map(variableTypeMap);
  for (const param of parameters) {
    localVariableTypeMap.set(param.name, param.type);
  }

  // Parse modifiers
  for (const mod of node.modifiers || []) {
    if (mod.name) {
      modifiers.push(mod.name);
    }
  }

  // Parse body for calls and emits (with variable type information)
  if (node.body) {
    extractCallsAndEmits(node.body, calls, emits, localVariableTypeMap);
  }

  const paramTypes = parameters.map((p) => p.type).join(',');
  const signature = `${node.name}(${paramTypes})`;
  const selector = computeSelector(signature);

  const baseFunc = {
    name: node.name,
    stateMutability: stateMutability as 'pure' | 'view' | 'nonpayable' | 'payable',
    parameters,
    returnValues,
    calls,
    emits,
    isVirtual: node.isVirtual || false,
    sourceCode: sourceCodeStr,
    startLine,
  };

  if (visibility === 'external' || visibility === 'public') {
    return {
      ...baseFunc,
      signature,
      selector,
      visibility: visibility as 'external' | 'public',
      modifiers,
    };
  } else {
    return {
      ...baseFunc,
      visibility: visibility as 'internal' | 'private',
    };
  }
}

function extractCallsAndEmits(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  node: any,
  calls: FunctionCall[],
  emits: string[],
  variableTypeMap: Map<string, string> = new Map()
) {
  const seen = new Set<string>();

  // Also collect local variable declarations within the function body
  const localTypes = new Map(variableTypeMap);

  function visit(n: any) {
    if (!n || typeof n !== 'object') return;

    // Track local variable declarations
    if (n.type === 'VariableDeclarationStatement') {
      for (const variable of n.variables || []) {
        if (variable?.name && variable?.typeName) {
          localTypes.set(variable.name, getTypeName(variable.typeName));
        }
      }
    }

    if (n.type === 'FunctionCall') {
      const call = extractFunctionCall(n, localTypes);
      if (call) {
        const key = `${call.type}:${call.target}:${call.targetType || ''}`;
        if (!seen.has(key)) {
          seen.add(key);
          calls.push(call);
        }
      }
    } else if (n.type === 'EmitStatement' && n.eventCall) {
      if (n.eventCall.expression?.name) {
        const eventName = n.eventCall.expression.name;
        if (!emits.includes(eventName)) {
          emits.push(eventName);
        }
      }
    }

    // Recursively visit all properties
    for (const key of Object.keys(n)) {
      const value = n[key];
      if (Array.isArray(value)) {
        for (const item of value) {
          visit(item);
        }
      } else if (value && typeof value === 'object') {
        visit(value);
      }
    }
  }

  visit(node);
}

function extractFunctionCall(node: any, variableTypeMap: Map<string, string> = new Map()): FunctionCall | null {
  const expr = node.expression;

  if (!expr) return null;

  // Member access: obj.func()
  if (expr.type === 'MemberAccess') {
    const memberName = expr.memberName;
    const objExpr = expr.expression;

    // Detect delegatecall patterns
    // Pattern 1: address.delegatecall(data)
    if (memberName === 'delegatecall') {
      // Try to extract the target from the first argument if it's a function selector
      const args = node.arguments || [];
      let target = 'unknown';
      if (args.length > 0 && args[0].type === 'FunctionCall') {
        // abi.encodeWithSelector(selector, ...) pattern
        target = 'encoded_call';
      }
      return {
        target,
        type: 'delegatecall',
      };
    }

    // Pattern 2: Address.functionDelegateCall(target, data) - OpenZeppelin
    if (memberName === 'functionDelegateCall' && objExpr?.type === 'Identifier' && objExpr.name === 'Address') {
      const args = node.arguments || [];
      let target = 'unknown';
      if (args.length > 0 && args[0].type === 'Identifier') {
        target = args[0].name;
      }
      return {
        target,
        type: 'delegatecall',
      };
    }

    if (objExpr?.type === 'Identifier') {
      const objName = objExpr.name;

      // Skip Solidity built-in globals (abi, block, msg, tx, etc.)
      // These are not function calls, just built-in operations
      const builtinGlobals = ['abi', 'block', 'msg', 'tx', 'type'];
      if (builtinGlobals.includes(objName)) {
        return null;
      }

      // Library call pattern: LibName.func()
      if (objName[0] === objName[0].toUpperCase()) {
        return {
          target: `${objName}.${memberName}`,
          type: 'library',
        };
      }

      // super.func()
      if (objName === 'super') {
        return {
          target: memberName,
          type: 'super',
        };
      }

      // External call: contract.func()
      // Look up the type of the variable to help resolve the actual contract
      const variableType = variableTypeMap.get(objName);
      return {
        target: `${objName}.${memberName}`,
        type: 'external',
        targetType: variableType,
      };
    }

    return null;
  }

  // Direct call: func()
  if (expr.type === 'Identifier') {
    const name = expr.name;

    // Skip Solidity built-ins, reserved words, and type keywords
    const builtins = [
      // Built-in functions
      'require', 'assert', 'revert', 'keccak256', 'sha256', 'ripemd160',
      'ecrecover', 'addmod', 'mulmod', 'selfdestruct', 'suicide',
      // Global variables
      'abi', 'block', 'msg', 'tx', 'gasleft', 'blockhash', 'now',
      // Type keywords and casting
      'type', 'address', 'payable', 'bytes', 'string', 'bool',
      'int', 'uint', 'bytes1', 'bytes2', 'bytes3', 'bytes4',
      'bytes8', 'bytes16', 'bytes20', 'bytes32',
      'int8', 'int16', 'int32', 'int64', 'int128', 'int256',
      'uint8', 'uint16', 'uint32', 'uint64', 'uint128', 'uint256',
      // Other reserved
      'this', 'super', 'new', 'delete',
    ];
    if (builtins.includes(name)) {
      return null;
    }

    // Internal function call (starts with _ or lowercase)
    if (name.startsWith('_') || name[0] === name[0].toLowerCase()) {
      return {
        target: name,
        type: 'internal',
      };
    }

    return null;
  }

  return null;
}

function parseEventDefinition(node: ASTEventDefinition): EventDefinition {
  return {
    name: node.name,
    parameters: node.parameters.map((p) => ({
      name: p.name || '',
      type: getTypeName(p.typeName),
      indexed: p.isIndexed,
    })),
  };
}

function parseErrorDefinition(node: CustomErrorDefinition): ErrorDefinition {
  return {
    name: node.name,
    parameters: node.parameters.map((p) => ({
      name: p.name || '',
      type: getTypeName(p.typeName),
    })),
  };
}

function parseStructDefinition(node: any): StructDefinition {
  return {
    name: node.name,
    members: (node.members || []).map((m: any) => ({
      name: m.name || '',
      type: getTypeName(m.typeName),
    })),
    startLine: node.loc?.start?.line,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTypeName(typeName: any | null): string {
  if (!typeName) return 'unknown';

  if (typeName.type === 'ElementaryTypeName') {
    return typeName.name;
  }

  if (typeName.type === 'UserDefinedTypeName') {
    return typeName.namePath;
  }

  if (typeName.type === 'ArrayTypeName') {
    const baseType = getTypeName(typeName.baseTypeName);
    return typeName.length ? `${baseType}[${typeName.length}]` : `${baseType}[]`;
  }

  if (typeName.type === 'Mapping') {
    const keyType = getTypeName(typeName.keyType);
    const valueType = getTypeName(typeName.valueType);
    return `mapping(${keyType} => ${valueType})`;
  }

  return 'unknown';
}

/**
 * Determine category dynamically from directory structure.
 * Extracts the first meaningful directory name after common prefixes.
 *
 * Examples:
 * - @openzeppelin/contracts/access/Ownable.sol → 'access'
 * - solady/src/auth/Ownable.sol → 'auth'
 * - src/MyProject/Core/Contract.sol → 'Core'
 */
function determineCategory(
  name: string,
  inherits: string[],
  kind: ContractKind,
  filePath: string
): ContractCategory {
  // Interface and library are special categories
  if (kind === 'interface') return 'interface';
  if (kind === 'library') return 'library';

  // Handle specific library patterns with remappings
  // @openzeppelin/contracts@5.0.2/access/Ownable.sol → "OpenZeppelin/access"
  // @openzeppelin/contracts-upgradeable@5.0.2/proxy/... → "OZ-Upgradeable/proxy"
  // solady/src/auth/Ownable.sol → "Solady/auth"

  // OpenZeppelin patterns
  const ozMatch = filePath.match(/^@openzeppelin\/contracts(?:-upgradeable)?(?:@[\d.]+)?\/(.+)\//);
  if (ozMatch) {
    const subCategory = ozMatch[1]; // e.g., "access", "token/ERC20", "proxy"
    const isUpgradeable = filePath.includes('-upgradeable');
    const prefix = isUpgradeable ? 'OZ-Upgradeable' : 'OpenZeppelin';
    // Take only the first directory level for cleaner categories
    const firstDir = subCategory.split('/')[0];
    return `${prefix}/${firstDir}`;
  }

  // Solady pattern
  if (filePath.startsWith('solady/')) {
    const match = filePath.match(/^solady\/(?:src\/)?([^/]+)\//);
    if (match) {
      return `Solady/${match[1]}`;
    }
    return 'Solady';
  }

  // Split path into segments for generic handling
  const segments = filePath.split('/').filter(s => s.length > 0);

  // Common non-meaningful directory names to skip (case-insensitive)
  const skipPrefixes = new Set([
    'contracts', 'contract', 'src', 'lib', 'node_modules',
    'core', 'base', 'main', 'app', 'packages', 'modules',
    'solidity', 'sol', 'smart-contracts', 'smartcontracts',
  ]);

  // Generic structural directories to skip
  const skipGeneric = new Set([
    'interfaces', 'interface', 'libraries', 'library',
    'abstract', 'abstracts', 'internal', 'external',
    'mocks', 'mock', 'test', 'tests', 'scripts', 'script',
    'deploy', 'deployments', 'migrations',
  ]);

  // Find the first meaningful directory from the path
  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i];
    const lowerSegment = segment.toLowerCase();

    // Skip common non-meaningful directories
    if (skipPrefixes.has(lowerSegment)) continue;

    // Skip generic structural directories
    if (skipGeneric.has(lowerSegment)) continue;

    // Skip segments starting with @ (scoped packages) or containing version
    if (segment.startsWith('@') || segment.includes('@')) continue;

    // Skip file extensions
    if (segment.endsWith('.sol')) continue;

    // Skip very short names (likely abbreviations or single letters)
    if (segment.length <= 2) continue;

    // Found a meaningful directory name - use it as category
    return segment;
  }

  // Fallback: use 'other' if no category could be determined
  return 'other';
}

// Simple selector computation (not cryptographically correct, just for display)
function computeSelector(signature: string): string {
  let hash = 0;
  for (let i = 0; i < signature.length; i++) {
    const char = signature.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return '0x' + Math.abs(hash).toString(16).padStart(8, '0').slice(0, 8);
}

// Filter options
interface FilterOptions {
  excludeInterfaces?: boolean;
  excludeLibraries?: boolean;
  excludeMocks?: boolean;
  excludeStorages?: boolean;
}

const defaultFilterOptions: FilterOptions = {
  excludeInterfaces: false,  // Include interfaces for inheritance tracking
  excludeLibraries: false,   // Include libraries for call flow analysis
  excludeMocks: true,
  excludeStorages: false,    // Include storages for call flow analysis
};

// Check if contract should be excluded
function shouldExcludeContract(
  contract: Contract,
  filePath: string,
  options: FilterOptions
): boolean {
  const lowerName = contract.name.toLowerCase();
  const lowerPath = filePath.toLowerCase();

  // Exclude interfaces
  if (options.excludeInterfaces && contract.kind === 'interface') {
    return true;
  }

  // Exclude libraries
  if (options.excludeLibraries && contract.kind === 'library') {
    return true;
  }

  // Exclude Mock contracts
  if (options.excludeMocks && lowerName.includes('mock')) {
    return true;
  }

  // Exclude Storage/Schema contracts (by path or name)
  if (options.excludeStorages) {
    if (
      lowerPath.includes('/storages/') ||
      lowerPath.includes('/storage/') ||
      lowerName === 'storage' ||
      lowerName === 'schema' ||
      lowerName.endsWith('storage') ||
      lowerName.endsWith('schema')
    ) {
      return true;
    }
  }

  return false;
}

// Parse multiple files
export function parseSolidityFiles(
  files: Array<{ path: string; content: string }>,
  options: FilterOptions = defaultFilterOptions
): Contract[] {
  const allContracts: Contract[] = [];
  const mergedOptions = { ...defaultFilterOptions, ...options };

  for (const file of files) {
    const { contracts } = parseSolidityFile(file.path, file.content);

    for (const contract of contracts) {
      if (!shouldExcludeContract(contract, file.path, mergedOptions)) {
        allContracts.push(contract);
      }
    }
  }

  return allContracts;
}
