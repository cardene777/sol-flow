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
  ImportInfo,
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
  } catch (e) {
    console.error(`Failed to parse ${filePath}:`, e);
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
  const usesLibraries: string[] = [];

  // Process contract body
  for (const subNode of node.subNodes) {
    if (subNode.type === 'FunctionDefinition') {
      const func = parseFunctionDefinition(subNode as FunctionDefinition, sourceCode);
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
  };
}

function parseFunctionDefinition(
  node: FunctionDefinition,
  sourceCode: string
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

  // Parse modifiers
  for (const mod of node.modifiers || []) {
    if (mod.name) {
      modifiers.push(mod.name);
    }
  }

  // Parse body for calls and emits
  if (node.body) {
    extractCallsAndEmits(node.body, calls, emits);
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
  emits: string[]
) {
  const seen = new Set<string>();

  function visit(n: any) {
    if (!n || typeof n !== 'object') return;

    if (n.type === 'FunctionCall') {
      const call = extractFunctionCall(n);
      if (call) {
        const key = `${call.type}:${call.target}`;
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

function extractFunctionCall(node: any): FunctionCall | null {
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
      return {
        target: `${objName}.${memberName}`,
        type: 'external',
      };
    }

    return null;
  }

  // Direct call: func()
  if (expr.type === 'Identifier') {
    const name = expr.name;

    // Skip common built-ins
    if (['require', 'assert', 'revert', 'keccak256', 'abi', 'block', 'msg', 'tx'].includes(name)) {
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

function determineCategory(
  name: string,
  inherits: string[],
  kind: ContractKind,
  filePath: string
): ContractCategory {
  if (kind === 'interface') return 'interface';
  if (kind === 'library') return 'library';

  const lowerPath = filePath.toLowerCase();
  const lowerName = name.toLowerCase();

  // Detect from file path (OpenZeppelin directory structure)
  if (lowerPath.includes('/access/')) return 'access';
  if (lowerPath.includes('/account/')) return 'account';
  if (lowerPath.includes('/finance/')) return 'finance';
  if (lowerPath.includes('/governance/')) return 'governance';
  if (lowerPath.includes('/metatx/')) return 'metatx';
  if (lowerPath.includes('/proxy/')) return 'proxy';
  if (lowerPath.includes('/token/')) return 'token';
  if (lowerPath.includes('/utils/')) return 'utils';

  // Fallback to name-based detection
  if (
    lowerName.includes('erc20') ||
    lowerName.includes('erc721') ||
    lowerName.includes('erc1155') ||
    lowerName.includes('token')
  ) {
    return 'token';
  }

  if (
    lowerName.includes('ownable') ||
    lowerName.includes('access') ||
    lowerName.includes('role')
  ) {
    return 'access';
  }

  if (lowerName.includes('proxy') || lowerName.includes('upgradeable')) return 'proxy';
  if (lowerName.includes('pausable') || lowerName.includes('reentrancy') || lowerName.includes('context')) return 'utils';
  if (lowerName.includes('governor') || lowerName.includes('timelock') || lowerName.includes('votes')) return 'governance';

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
