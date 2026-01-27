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

  // Category detection based on path
  let category = 'other';
  const lowerPath = filePath.toLowerCase();
  if (kind === 'interface') category = 'interface';
  else if (kind === 'library') category = 'library';
  else if (lowerPath.includes('/access/')) category = 'access';
  else if (lowerPath.includes('/account/')) category = 'account';
  else if (lowerPath.includes('/finance/')) category = 'finance';
  else if (lowerPath.includes('/governance/')) category = 'governance';
  else if (lowerPath.includes('/metatx/')) category = 'metatx';
  else if (lowerPath.includes('/proxy/')) category = 'proxy';
  else if (lowerPath.includes('/token/')) category = 'token';
  else if (lowerPath.includes('/utils/')) category = 'utils';
  else if (lowerPath.includes('/auth/')) category = 'access';
  else if (lowerPath.includes('/tokens/')) category = 'token';

  const externalFunctions = [];
  const internalFunctions = [];
  const events = [];
  const usesLibraries = [];

  for (const member of node.subNodes || []) {
    if (member.type === 'FunctionDefinition') {
      const func = parseFunction(member, source);
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
      });
    } else if (member.type === 'UsingForDeclaration') {
      if (member.libraryName) {
        usesLibraries.push(member.libraryName);
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
    stateVariables: [],
    usesLibraries,
    imports: [],
  };
}

// Parse a function definition
function parseFunction(node, source) {
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

  const calls = [];

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

    // Detect proxy patterns (but NOT ERC-7546 for these standard libraries)
    for (const contract of allContracts) {
      const { pattern, role } = detectProxyPattern(contract, lib.id);
      if (pattern) {
        contract.proxyPattern = pattern;
        contract.proxyRole = role;
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
