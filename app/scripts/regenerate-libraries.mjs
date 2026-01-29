#!/usr/bin/env node
/**
 * Script to regenerate pre-parsed library JSON files
 * Run with: node scripts/regenerate-libraries.mjs
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse } from '@solidity-parser/parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Library configurations
const LIBRARIES = [
  {
    id: 'openzeppelin',
    name: 'OpenZeppelin Contracts',
    version: '5.0.0',
    sourceDir: '../../library/openzeppelin-contracts/contracts',
    outputFile: '../src/data/libraries/openzeppelin-parsed.json',
  },
  {
    id: 'openzeppelin-upgradeable',
    name: 'OpenZeppelin Upgradeable',
    version: '5.0.0',
    sourceDir: '../../library/openzeppelin-contracts-upgradeable/contracts',
    outputFile: '../src/data/libraries/openzeppelin-upgradeable-parsed.json',
  },
  {
    id: 'solady',
    name: 'Solady',
    version: 'latest',
    sourceDir: '../../library/solady/src',
    outputFile: '../src/data/libraries/solady-parsed.json',
  },
  {
    id: 'sample-uups',
    name: 'UUPS Proxy Sample',
    version: '1.0.0',
    sourceDir: '../../contracts/samples/uups',
    outputFile: '../src/data/libraries/sample-uups-parsed.json',
  },
  {
    id: 'sample-transparent',
    name: 'Transparent Proxy Sample',
    version: '1.0.0',
    sourceDir: '../../contracts/samples/transparent',
    outputFile: '../src/data/libraries/sample-transparent-parsed.json',
  },
  {
    id: 'sample-diamond',
    name: 'Diamond Proxy Sample',
    version: '1.0.0',
    sourceDir: '../../contracts/samples/diamond',
    outputFile: '../src/data/libraries/sample-diamond-parsed.json',
  },
  {
    id: 'sample-beacon',
    name: 'Beacon Proxy Sample',
    version: '1.0.0',
    sourceDir: '../../contracts/samples/beacon',
    outputFile: '../src/data/libraries/sample-beacon-parsed.json',
  },
];

// Find all .sol files recursively
function findSolFiles(dir, files = []) {
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        // Skip test, mock, and vendor directories
        if (!['test', 'tests', 'mock', 'mocks', 'vendor'].includes(entry.toLowerCase())) {
          findSolFiles(fullPath, files);
        }
      } else if (entry.endsWith('.sol') && !entry.includes('.t.sol')) {
        files.push(fullPath);
      }
    }
  } catch (e) {
    console.error(`Error reading directory ${dir}:`, e.message);
  }
  return files;
}

// Solidity built-ins to filter out
const BUILTINS = new Set([
  'require', 'assert', 'revert', 'keccak256', 'sha256', 'ripemd160',
  'ecrecover', 'addmod', 'mulmod', 'selfdestruct', 'suicide',
  'abi', 'block', 'msg', 'tx', 'gasleft', 'blockhash', 'now',
  'type', 'address', 'payable', 'bytes', 'string', 'bool',
  'int', 'uint', 'bytes1', 'bytes2', 'bytes3', 'bytes4',
  'bytes8', 'bytes16', 'bytes20', 'bytes32',
  'int8', 'int16', 'int32', 'int64', 'int128', 'int256',
  'uint8', 'uint16', 'uint32', 'uint64', 'uint128', 'uint256',
  'this', 'super', 'new', 'delete',
]);

// Parse a single Solidity file
function parseFile(filePath, baseDir) {
  const source = readFileSync(filePath, 'utf-8');
  const relativePath = filePath.replace(baseDir, '').replace(/^[/\\]/, '');

  try {
    const ast = parse(source, { loc: true, range: true, tolerant: true });
    const contracts = [];

    for (const node of ast.children) {
      if (node.type === 'ContractDefinition') {
        const contract = parseContract(node, source, relativePath);
        if (contract) {
          contracts.push(contract);
        }
      }
    }

    // Extract imports
    const imports = [];
    for (const node of ast.children) {
      if (node.type === 'ImportDirective') {
        imports.push({
          path: node.path,
          name: node.unitAlias || node.symbolAliases?.[0]?.foreign?.name || '',
          alias: node.symbolAliases?.[0]?.local?.name || '',
          isExternal: node.path.startsWith('@') || !node.path.startsWith('.'),
        });
      }
    }

    // Attach imports to contracts
    for (const contract of contracts) {
      contract.imports = imports;
    }

    return contracts;
  } catch (e) {
    console.error(`  Error parsing ${relativePath}:`, e.message);
    return [];
  }
}

// Parse a contract node
function parseContract(node, source, filePath) {
  const kind = node.kind || 'contract';
  const name = node.name;
  const inherits = (node.baseContracts || []).map(b => b.baseName.namePath);
  const implements_ = [];

  // Category detection based on path - use directory structure for detailed categories
  let category = 'other';
  // Normalize path for matching (add leading / if not present)
  const lowerPath = ('/' + filePath).toLowerCase();

  // Interface and library kinds take priority
  if (kind === 'interface') {
    category = 'interface';
  } else if (kind === 'library') {
    category = 'library';
  }
  // Token categories - check specific token standards first
  else if (lowerPath.includes('/token/erc20/')) category = 'token/ERC20';
  else if (lowerPath.includes('/token/erc721/')) category = 'token/ERC721';
  else if (lowerPath.includes('/token/erc1155/')) category = 'token/ERC1155';
  else if (lowerPath.includes('/token/erc6909/')) category = 'token/ERC6909';
  else if (lowerPath.includes('/token/common/')) category = 'token/common';
  else if (lowerPath.includes('/token/')) category = 'token';
  else if (lowerPath.includes('/tokens/')) category = 'token';
  // Proxy categories
  else if (lowerPath.includes('/proxy/beacon/')) category = 'proxy/beacon';
  else if (lowerPath.includes('/proxy/transparent/')) category = 'proxy/transparent';
  else if (lowerPath.includes('/proxy/erc1967/')) category = 'proxy/ERC1967';
  else if (lowerPath.includes('/proxy/utils/')) category = 'proxy/utils';
  else if (lowerPath.includes('/proxy/')) category = 'proxy';
  // Utils categories
  else if (lowerPath.includes('/utils/cryptography/')) category = 'utils/cryptography';
  else if (lowerPath.includes('/utils/math/')) category = 'utils/math';
  else if (lowerPath.includes('/utils/structs/')) category = 'utils/structs';
  else if (lowerPath.includes('/utils/introspection/')) category = 'utils/introspection';
  else if (lowerPath.includes('/utils/types/')) category = 'utils/types';
  else if (lowerPath.includes('/utils/')) category = 'utils';
  // Access categories
  else if (lowerPath.includes('/access/manager/')) category = 'access/manager';
  else if (lowerPath.includes('/access/extensions/')) category = 'access/extensions';
  else if (lowerPath.includes('/access/')) category = 'access';
  else if (lowerPath.includes('/auth/')) category = 'access';
  // Governance categories
  else if (lowerPath.includes('/governance/extensions/')) category = 'governance/extensions';
  else if (lowerPath.includes('/governance/utils/')) category = 'governance/utils';
  else if (lowerPath.includes('/governance/')) category = 'governance';
  // Other top-level categories
  else if (lowerPath.includes('/account/')) category = 'account';
  else if (lowerPath.includes('/finance/')) category = 'finance';
  else if (lowerPath.includes('/metatx/')) category = 'metatx';
  else if (lowerPath.includes('/crosschain/')) category = 'crosschain';

  const externalFunctions = [];
  const internalFunctions = [];
  const events = [];
  const errors = [];
  const structs = [];
  const stateVariables = [];
  const usesLibraries = [];

  // First pass: collect using declarations
  for (const member of node.subNodes || []) {
    if (member.type === 'UsingForDeclaration') {
      if (member.libraryName) {
        usesLibraries.push(member.libraryName);
      }
    }
  }

  // Second pass: parse all contract members
  for (const member of node.subNodes || []) {
    if (member.type === 'FunctionDefinition') {
      const func = parseFunction(member, source, usesLibraries);
      if (func) {
        if (func.visibility === 'external' || func.visibility === 'public') {
          externalFunctions.push(func);
        } else {
          internalFunctions.push({
            name: func.name,
            visibility: func.visibility,
            stateMutability: func.stateMutability,
            parameters: func.parameters,
            returnValues: func.returnValues,
            calls: func.calls,
            isVirtual: func.isVirtual,
            sourceCode: func.sourceCode,
            startLine: func.startLine,
          });
        }
      }
    } else if (member.type === 'EventDefinition') {
      events.push({
        name: member.name,
        parameters: (member.parameters || []).map(p => ({
          name: p.name || '',
          type: formatType(p.typeName),
          indexed: p.isIndexed || false,
        })),
        startLine: member.loc?.start?.line,
      });
    } else if (member.type === 'CustomErrorDefinition') {
      errors.push({
        name: member.name,
        parameters: (member.parameters || []).map(p => ({
          name: p.name || '',
          type: formatType(p.typeName),
        })),
        startLine: member.loc?.start?.line,
      });
    } else if (member.type === 'StructDefinition') {
      // Parse struct definitions
      structs.push({
        name: member.name,
        members: (member.members || []).map(m => ({
          name: m.name || '',
          type: formatType(m.typeName),
        })),
        startLine: member.loc?.start?.line,
      });
    } else if (member.type === 'StateVariableDeclaration') {
      // Parse state variables
      for (const variable of member.variables || []) {
        if (variable.name) {
          stateVariables.push({
            name: variable.name,
            type: formatType(variable.typeName),
            visibility: variable.visibility || 'internal',
            isConstant: variable.isDeclaredConst || false,
            isImmutable: variable.isImmutable || false,
            startLine: member.loc?.start?.line,
          });
        }
      }
    }
  }

  return {
    name,
    filePath,
    kind,
    inherits,
    implements: implements_,
    category,
    externalFunctions,
    internalFunctions,
    events,
    errors,
    structs,
    stateVariables,
    usesLibraries,
    imports: [],
  };
}

// Extract function calls from AST node
function extractCalls(node, usesLibraries = [], calls = [], seen = new Set()) {
  if (!node || typeof node !== 'object') return calls;

  // Skip these node types entirely - they don't contain function calls
  // EmitStatement: emit EventName(...) - EventName is an event, not a function
  // RevertStatement: revert CustomError(...) - CustomError is an error, not a function
  // ThrowStatement: throw (deprecated but might exist in old code)
  const skipNodeTypes = [
    'EmitStatement',
    'RevertStatement',
    'ThrowStatement',
  ];
  if (skipNodeTypes.includes(node.type)) {
    return calls;
  }

  // Handle FunctionCall nodes
  if (node.type === 'FunctionCall') {
    // Get argument count for overloaded function matching
    const argCount = node.arguments?.length ?? 0;
    const call = parseFunctionCall(node, usesLibraries, argCount);
    if (call) {
      // Include argCount in the key for unique identification of overloaded calls
      const key = `${call.type}:${call.target}:${call.argCount ?? 0}`;
      if (!seen.has(key)) {
        seen.add(key);
        calls.push(call);
      }
    }
  }

  // Recursively visit all properties
  for (const key of Object.keys(node)) {
    const value = node[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        extractCalls(item, usesLibraries, calls, seen);
      }
    } else if (value && typeof value === 'object') {
      extractCalls(value, usesLibraries, calls, seen);
    }
  }

  return calls;
}

// Check if a name looks like a custom error (used with revert)
function isLikelyCustomError(name) {
  // Common error name patterns
  const errorPatterns = [
    /Error$/,           // EndsWithError
    /^Err[A-Z]/,        // ErrSomething
    /Invalid/,          // Contains Invalid
    /Insufficient/,     // Contains Insufficient
    /Unauthorized/,     // Contains Unauthorized
    /NotFound/,         // Contains NotFound
    /Already/,          // Contains Already
    /Exceeded/,         // Contains Exceeded
    /Failed/,           // Contains Failed
    /Denied/,           // Contains Denied
    /Overflow/,         // Contains Overflow
    /Underflow/,        // Contains Underflow
    /^Only[A-Z]/,       // OnlySomething
    /^No[A-Z]/,         // NoSomething
    /^Cannot[A-Z]/,     // CannotSomething
    /^Missing[A-Z]/,    // MissingSomething
    /^Zero[A-Z]/,       // ZeroSomething
    /^Empty[A-Z]/,      // EmptySomething
  ];
  return errorPatterns.some(pattern => pattern.test(name));
}

// Check if a name looks like an event
function isLikelyEvent(name) {
  // Common event name patterns (past tense or action nouns)
  const eventPatterns = [
    /^Transfer$/,
    /^Approval$/,
    /^Deposit$/,
    /^Withdrawal$/,
    /ed$/,              // Transferred, Approved, Minted, etc.
    /^Log[A-Z]/,        // LogSomething
  ];
  return eventPatterns.some(pattern => pattern.test(name));
}

// Helper to extract type name from a type cast expression
// e.g., IERC20(asset()) -> "IERC20", address(this) -> "address"
function extractTypeCastName(node) {
  if (node?.type === 'FunctionCall' && node.expression?.type === 'Identifier') {
    const name = node.expression.name;
    // Check if it looks like a type cast (starts with uppercase or is a builtin type)
    const builtinTypes = ['address', 'payable', 'bytes', 'string', 'uint', 'int', 'bool'];
    if (name[0] === name[0].toUpperCase() || builtinTypes.some(t => name.startsWith(t))) {
      return name;
    }
  }
  return null;
}

// Check if a name is an interface (starts with I followed by uppercase)
function isInterfaceName(name) {
  return name.length > 1 && name[0] === 'I' && name[1] === name[1].toUpperCase();
}

// Get implementation name from interface name (IERC20 -> ERC20)
function getImplementationName(interfaceName) {
  if (isInterfaceName(interfaceName)) {
    return interfaceName.slice(1);
  }
  return interfaceName;
}

// Parse a FunctionCall AST node
function parseFunctionCall(node, usesLibraries = [], argCount = 0) {
  const expr = node.expression;
  if (!expr) return null;

  // Member access: obj.func()
  if (expr.type === 'MemberAccess') {
    const memberName = expr.memberName;
    const objExpr = expr.expression;

    // Skip built-in globals and their member access
    if (objExpr?.type === 'Identifier') {
      const objName = objExpr.name;
      // Global objects with properties/methods
      const builtinGlobals = [
        'abi',      // abi.encode, abi.decode, abi.encodePacked, etc.
        'block',    // block.timestamp, block.number, block.coinbase, etc.
        'msg',      // msg.sender, msg.value, msg.data, msg.sig
        'tx',       // tx.gasprice, tx.origin
        'type',     // type(X).min, type(X).max, type(X).creationCode, etc.
        'bytes',    // bytes.concat
        'string',   // string.concat
      ];
      if (builtinGlobals.includes(objName)) {
        return null;
      }

      // Library call pattern: LibName.func() (starts with uppercase, not an interface)
      // Interfaces start with I followed by uppercase (e.g., IERC20)
      if (objName[0] === objName[0].toUpperCase() && !isInterfaceName(objName)) {
        return {
          target: `${objName}.${memberName}`,
          type: 'library',
          argCount,
        };
      }

      // super.func()
      if (objName === 'super') {
        return {
          target: memberName,
          type: 'super',
          argCount,
        };
      }

      // Check if this could be a "using X for Y" library call
      // e.g., assets.mulDiv(...) where "using Math for uint256"
      // If the object is lowercase (likely a variable) and we have usesLibraries,
      // check if the function name is likely from a library
      if (usesLibraries.length > 0 && objName[0] === objName[0].toLowerCase()) {
        for (const libName of usesLibraries) {
          return {
            target: `${libName}.${memberName}`,
            type: 'library',
            argCount,
          };
        }
      }

      // External call: contract.func() or Interface.func()
      // For interfaces, we'll try to resolve to implementation
      const targetName = isInterfaceName(objName) ? getImplementationName(objName) : objName;
      return {
        target: memberName,
        type: 'external',
        targetType: targetName,
        argCount,
      };
    }

    // Handle method calls on type casts: e.g., IERC20(asset()).balanceOf()
    // objExpr is a FunctionCall like IERC20(asset())
    const typeCastName = extractTypeCastName(objExpr);
    if (typeCastName) {
      // Skip address type casts - these are just conversions
      if (typeCastName === 'address' || typeCastName === 'payable') {
        return null;
      }

      // For interface type casts (IERC20), try to get implementation name (ERC20)
      const targetName = isInterfaceName(typeCastName) ? getImplementationName(typeCastName) : typeCastName;
      return {
        target: memberName,
        type: 'external',
        targetType: targetName,
        argCount,
      };
    }

    // Handle chained calls or method calls on other complex expressions
    // e.g., someMapping[key].func(), (a + b).something()
    // For "using" library calls on complex expressions
    if (usesLibraries.length > 0) {
      for (const libName of usesLibraries) {
        return {
          target: `${libName}.${memberName}`,
          type: 'library',
          argCount,
        };
      }
    }

    // Unknown member access - skip
    return null;
  }

  // Direct function call: func()
  if (expr.type === 'Identifier') {
    const name = expr.name;

    // Built-in functions and type casts (from Solidity docs)
    // https://docs.soliditylang.org/en/latest/units-and-global-variables.html
    const builtins = [
      // Error handling
      'require', 'assert', 'revert',

      // Cryptographic functions
      'keccak256', 'sha256', 'ripemd160', 'ecrecover',

      // Mathematical functions
      'addmod', 'mulmod',

      // Block and transaction properties (functions)
      'blockhash',    // blockhash(uint blockNumber) returns (bytes32)
      'blobhash',     // blobhash(uint index) returns (bytes32) - EIP-4844
      'gasleft',      // gasleft() returns (uint256)

      // Contract related
      'selfdestruct', // selfdestruct(address payable recipient)
      'this',         // current contract
      'super',        // parent contract

      // Keywords that look like function calls
      'new',          // new ContractName()
      'delete',       // delete variable
      'type',         // type(X).min, type(X).max, etc.

      // Type casts - these are NOT function calls, they're type conversions
      // Address types
      'address', 'payable',

      // Fixed-size byte arrays
      'bytes1', 'bytes2', 'bytes3', 'bytes4', 'bytes5', 'bytes6', 'bytes7', 'bytes8',
      'bytes9', 'bytes10', 'bytes11', 'bytes12', 'bytes13', 'bytes14', 'bytes15', 'bytes16',
      'bytes17', 'bytes18', 'bytes19', 'bytes20', 'bytes21', 'bytes22', 'bytes23', 'bytes24',
      'bytes25', 'bytes26', 'bytes27', 'bytes28', 'bytes29', 'bytes30', 'bytes31', 'bytes32',

      // Dynamic types
      'bytes', 'string',

      // Unsigned integers
      'uint', 'uint8', 'uint16', 'uint24', 'uint32', 'uint40', 'uint48', 'uint56', 'uint64',
      'uint72', 'uint80', 'uint88', 'uint96', 'uint104', 'uint112', 'uint120', 'uint128',
      'uint136', 'uint144', 'uint152', 'uint160', 'uint168', 'uint176', 'uint184', 'uint192',
      'uint200', 'uint208', 'uint216', 'uint224', 'uint232', 'uint240', 'uint248', 'uint256',

      // Signed integers
      'int', 'int8', 'int16', 'int24', 'int32', 'int40', 'int48', 'int56', 'int64',
      'int72', 'int80', 'int88', 'int96', 'int104', 'int112', 'int120', 'int128',
      'int136', 'int144', 'int152', 'int160', 'int168', 'int176', 'int184', 'int192',
      'int200', 'int208', 'int216', 'int224', 'int232', 'int240', 'int248', 'int256',

      // Boolean
      'bool',
    ];
    if (builtins.includes(name)) {
      return null;
    }

    // Skip custom errors (typically PascalCase and match error patterns)
    if (name[0] === name[0].toUpperCase() && isLikelyCustomError(name)) {
      return null;
    }

    // Skip interface type casts: IERC20(...), IERC721(...), etc.
    // These are type conversions, not function calls
    if (isInterfaceName(name)) {
      return null;
    }

    // Skip contract type casts that look like constructors but are just casts
    // e.g., ERC20(someAddress) - if it's used as a type cast (usually in expressions)
    // We can detect this by checking if the arguments suggest it's a cast
    // For now, we'll be conservative and skip uppercase names that aren't in usesLibraries
    if (name[0] === name[0].toUpperCase() && !usesLibraries.includes(name)) {
      // Could be a constructor call (new-like) or a type cast
      // Skip if it looks like a type cast (single address argument pattern)
      // This is a heuristic - we'll allow it if it seems like a real call
      // For safety, let's check if it's a known pattern
      const contractCastPatterns = [
        /^I[A-Z]/,      // Interface patterns (already handled above)
        /^ERC\d+$/,     // ERC standards as type casts
        /^IERC\d+$/,    // Interface ERC standards
      ];
      if (contractCastPatterns.some(p => p.test(name))) {
        return null;
      }
    }

    // Skip events (typically PascalCase and match event patterns)
    if (name[0] === name[0].toUpperCase() && isLikelyEvent(name)) {
      return null;
    }

    // Internal function call (starts with _ or lowercase)
    if (name.startsWith('_') || name[0] === name[0].toLowerCase()) {
      return {
        target: name,
        type: 'internal',
        argCount,
      };
    }

    // Could be a contract constructor or external
    return {
      target: name,
      type: 'external',
      argCount,
    };
  }

  return null;
}

// Parse a function definition
function parseFunction(node, source, usesLibraries = []) {
  const name = node.name || (node.isConstructor ? 'constructor' : node.isFallback ? 'fallback' : node.isReceiveEther ? 'receive' : '');

  if (!name || BUILTINS.has(name)) {
    return null;
  }

  const visibility = node.visibility || 'internal';
  const stateMutability = node.stateMutability || 'nonpayable';
  const isVirtual = node.isVirtual || false;

  const parameters = (node.parameters || []).map(p => ({
    name: p.name || '',
    type: formatType(p.typeName),
  }));

  const returnValues = (node.returnParameters || []).map(p => ({
    name: p.name || '',
    type: formatType(p.typeName),
  }));

  // Extract function calls from body (pass usesLibraries for "using X for Y" detection)
  const calls = node.body ? extractCalls(node.body, usesLibraries) : [];

  // Extract source code
  let sourceCode = '';
  let startLine = 0;
  if (node.loc) {
    startLine = node.loc.start.line;
    if (node.range) {
      sourceCode = source.substring(node.range[0], node.range[1] + 1);
    }
  }

  // Build signature
  const paramTypes = parameters.map(p => p.type).join(',');
  const signature = `${name}(${paramTypes})`;

  return {
    name,
    signature,
    selector: '',
    visibility,
    stateMutability,
    parameters,
    returnValues,
    calls,
    emits: [],
    modifiers: [],
    isVirtual,
    sourceCode,
    startLine,
  };
}

// Format type name
function formatType(typeName) {
  if (!typeName) return 'unknown';

  switch (typeName.type) {
    case 'ElementaryTypeName':
      return typeName.name + (typeName.stateMutability ? ` ${typeName.stateMutability}` : '');
    case 'ArrayTypeName':
      return `${formatType(typeName.baseTypeName)}[]`;
    case 'Mapping':
      return `mapping(${formatType(typeName.keyType)} => ${formatType(typeName.valueType)})`;
    case 'UserDefinedTypeName':
      return typeName.namePath;
    case 'FunctionTypeName':
      return 'function';
    default:
      return 'unknown';
  }
}

// Detect proxy pattern - simplified version for libraries (no ERC-7546 for OpenZeppelin/Solady)
function detectProxyPattern(contract, libraryId = '') {
  const functionNames = [
    ...contract.externalFunctions.map(f => f.name),
    ...contract.internalFunctions.map(f => f.name),
  ];
  const inheritNames = contract.inherits.map(i => i.toLowerCase());
  const lowerName = contract.name.toLowerCase();
  const lowerPath = contract.filePath.toLowerCase();

  // Helper to check path patterns (works with or without leading slash)
  const pathIncludes = (pathPart) => lowerPath.includes(pathPart + '/') || lowerPath.startsWith(pathPart + '/');
  const isInDir = (dir) => lowerPath.startsWith(dir + '/') || lowerPath.includes('/' + dir + '/');

  // For sample libraries, extract the pattern from the library ID
  const isSampleLib = libraryId.startsWith('sample-');
  const samplePattern = isSampleLib ? libraryId.replace('sample-', '') : null;

  // For sample-diamond: detect interfaces, libraries, and facets first (before function-based detection)
  if (samplePattern === 'diamond') {
    if (contract.kind === 'interface') {
      return { pattern: 'diamond', role: 'interface' };
    }
    if (contract.kind === 'library') {
      return { pattern: 'diamond', role: 'library' };
    }
    if (lowerPath.includes('facets/') || lowerName.includes('facet')) {
      return { pattern: 'diamond', role: 'facet' };
    }
  }

  // UUPS Detection
  if (
    functionNames.includes('upgradeTo') ||
    functionNames.includes('upgradeToAndCall') ||
    inheritNames.some(i => i.includes('uups'))
  ) {
    if (functionNames.includes('proxiableUUID') || functionNames.includes('_authorizeUpgrade')) {
      return { pattern: 'uups', role: 'implementation' };
    }
    return { pattern: 'uups', role: 'proxy' };
  }

  // ERC1967Proxy (used by UUPS) detection
  if (inheritNames.some(i => i.includes('erc1967proxy'))) {
    return { pattern: 'uups', role: 'proxy' };
  }

  // Diamond path check helper
  const isInDiamondDir = isInDir('diamond') || lowerPath.startsWith('diamond/');

  // Diamond Library detection (check first - before function-based detection)
  if (isInDiamondDir && contract.kind === 'library') {
    return { pattern: 'diamond', role: 'library' };
  }

  // Diamond Interface detection (check first - before function-based detection)
  if (isInDiamondDir && contract.kind === 'interface') {
    return { pattern: 'diamond', role: 'interface' };
  }

  // Diamond Facet detection by path (check before general diamond detection)
  if (lowerPath.includes('facets/') && isInDiamondDir) {
    return { pattern: 'diamond', role: 'facet' };
  }

  // Diamond Detection by functions
  if (
    functionNames.includes('diamondCut') ||
    functionNames.includes('facets') ||
    functionNames.includes('facetAddress')
  ) {
    // Distinguish between proxy and facet
    if (lowerPath.includes('facets/') || lowerName.includes('facet')) {
      return { pattern: 'diamond', role: 'facet' };
    }
    return { pattern: 'diamond', role: 'proxy' };
  }

  // Diamond Proxy detection by path and name
  if (isInDiamondDir && lowerName === 'diamond') {
    return { pattern: 'diamond', role: 'proxy' };
  }

  // Beacon Detection
  if (inheritNames.some(i => i.includes('upgradeablebeacon'))) {
    return { pattern: 'beacon', role: 'beacon' };
  }

  if (
    functionNames.includes('implementation') &&
    (lowerName.includes('beacon') || inheritNames.some(i => i.includes('beacon')))
  ) {
    return { pattern: 'beacon', role: 'beacon' };
  }

  if (inheritNames.some(i => i.includes('beaconproxy'))) {
    return { pattern: 'beacon', role: 'proxy' };
  }

  // Beacon implementation detection by path
  if ((isInDir('beacon') || lowerPath.startsWith('beacon/')) && inheritNames.some(i => i.includes('initializable'))) {
    return { pattern: 'beacon', role: 'implementation' };
  }

  // Transparent Proxy Detection
  if (
    inheritNames.some(i => i.includes('transparentupgradeableproxy')) ||
    (lowerName.includes('proxy') && functionNames.includes('admin'))
  ) {
    return { pattern: 'transparent', role: 'proxy' };
  }

  // Transparent implementation detection by path
  if ((isInDir('transparent') || lowerPath.startsWith('transparent/')) && inheritNames.some(i => i.includes('initializable'))) {
    return { pattern: 'transparent', role: 'implementation' };
  }

  // For sample libraries: detect implementation contracts by Initializable inheritance
  if (samplePattern && inheritNames.some(i => i.includes('initializable'))) {
    // Diamond facets in facets directory
    if (samplePattern === 'diamond' && (lowerPath.includes('facets/') || lowerName.includes('facet'))) {
      return { pattern: 'diamond', role: 'facet' };
    }
    // Diamond main contract
    if (samplePattern === 'diamond' && lowerName === 'diamond') {
      return { pattern: 'diamond', role: 'proxy' };
    }
    // Otherwise it's an implementation contract
    return { pattern: samplePattern, role: 'implementation' };
  }

  // For sample libraries: detect Diamond components (interfaces, libraries, facets)
  if (samplePattern === 'diamond') {
    // Check kind first for interfaces and libraries
    if (contract.kind === 'interface') {
      return { pattern: 'diamond', role: 'interface' };
    }
    if (contract.kind === 'library') {
      return { pattern: 'diamond', role: 'library' };
    }
    if (lowerPath.includes('facets/') || lowerName.includes('facet')) {
      return { pattern: 'diamond', role: 'facet' };
    }
    if (lowerName === 'diamond') {
      return { pattern: 'diamond', role: 'proxy' };
    }
  }

  return {};
}

// Build directory structure
function buildDirectoryStructure(contracts) {
  const root = {
    name: 'contracts',
    type: 'directory',
    path: 'contracts',
    children: [],
  };

  for (const contract of contracts) {
    const parts = contract.filePath.split('/').filter(p => p);
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join('/');

      if (!current.children) current.children = [];

      let child = current.children.find(c => c.name === part);
      if (!child) {
        child = {
          name: part,
          type: isFile ? 'file' : 'directory',
          path: currentPath,
          children: isFile ? undefined : [],
          contractName: isFile ? contract.name : undefined,
        };
        current.children.push(child);
      }

      if (!isFile) current = child;
    }
  }

  return root;
}

// Main function
async function main() {
  console.log('Regenerating library JSON files...\n');

  for (const lib of LIBRARIES) {
    console.log(`Processing ${lib.name}...`);

    const sourceDir = join(__dirname, lib.sourceDir);
    const outputFile = join(__dirname, lib.outputFile);

    // Find all Solidity files
    const solFiles = findSolFiles(sourceDir);
    console.log(`  Found ${solFiles.length} .sol files`);

    // Parse all files
    const allContracts = [];
    for (const file of solFiles) {
      const contracts = parseFile(file, sourceDir);
      allContracts.push(...contracts);
    }
    console.log(`  Parsed ${allContracts.length} contracts`);

    // Detect proxy patterns (but NOT for reference libraries like OpenZeppelin, Solady)
    // These are reference libraries, not actual deployed proxy systems
    const skipProxyDetection = ['openzeppelin', 'openzeppelin-upgradeable', 'solady'].includes(lib.id);
    if (!skipProxyDetection) {
      for (const contract of allContracts) {
        const { pattern, role } = detectProxyPattern(contract, lib.id);
        if (pattern) {
          contract.proxyPattern = pattern;
          contract.proxyRole = role;
        }
      }
    }

    // Count proxy patterns
    const proxyCount = allContracts.filter(c => c.proxyPattern).length;
    console.log(`  Detected ${proxyCount} contracts with proxy patterns`);

    // Build call graph
    const callGraph = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      projectName: lib.name,
      structure: buildDirectoryStructure(allContracts),
      contracts: allContracts,
      dependencies: [],
      proxyGroups: [],
      stats: {
        totalContracts: allContracts.filter(c => c.kind === 'contract' || c.kind === 'abstract').length,
        totalLibraries: allContracts.filter(c => c.kind === 'library').length,
        totalInterfaces: allContracts.filter(c => c.kind === 'interface').length,
        totalFunctions: allContracts.reduce((sum, c) => sum + c.externalFunctions.length + c.internalFunctions.length, 0),
      },
    };

    // Build output
    const output = {
      id: lib.id,
      name: lib.name,
      version: lib.version,
      generatedAt: new Date().toISOString(),
      callGraph,
    };

    // Write output
    writeFileSync(outputFile, JSON.stringify(output, null, 2));
    const fileSize = (statSync(outputFile).size / 1024 / 1024).toFixed(2);
    console.log(`  Written to ${lib.outputFile} (${fileSize} MB)\n`);
  }

  console.log('Done!');
}

main().catch(console.error);
