/**
 * Script to build pre-parsed library cache from local files
 * Run with: npx tsx scripts/buildLocalLibraryCache.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseSolidityFiles, parseSolidityFile } from '../src/lib/solidityParser';
import { buildCallGraph } from '../src/lib/callGraphBuilder';
import type { Contract } from '../src/types/callGraph';

interface LibraryConfig {
  id: string;
  name: string;
  version: string;
  localPath: string;
  pathPrefix: string;
  excludePaths: string[];
  // If true, resolve external dependencies (OpenZeppelin, etc.)
  resolveExternalDeps?: boolean;
}

// External library mappings for dependency resolution
interface ExternalLibraryMapping {
  prefix: string;
  localPath: string;
  source: 'openzeppelin' | 'openzeppelin-upgradeable' | 'solady' | 'avalanche-icm';
}

const LIBRARY_BASE = path.join(__dirname, '..', '..', 'library');

// External library mappings for resolving dependencies
// These match the foundry.toml remappings:
// @openzeppelin/contracts@5.0.2=lib/openzeppelin-contracts-upgradeable/lib/openzeppelin-contracts/contracts
// @openzeppelin/contracts-upgradeable@5.0.2=lib/openzeppelin-contracts-upgradeable/contracts
// @forge-std=lib/forge-std/src
// @teleporter=icm-contracts/avalanche/teleporter
// @subnet-evm=icm-contracts/avalanche/subnet-evm
// @mocks=icm-contracts/avalanche/mocks
// @utilities=icm-contracts/avalanche/utilities
// @ictt=icm-contracts/avalanche/ictt
// @validator-manager=icm-contracts/avalanche/validator-manager
const EXTERNAL_LIBRARY_MAPPINGS: ExternalLibraryMapping[] = [
  // OpenZeppelin
  {
    prefix: '@openzeppelin/contracts-upgradeable',
    localPath: path.join(LIBRARY_BASE, 'openzeppelin-contracts-upgradeable', 'contracts'),
    source: 'openzeppelin-upgradeable',
  },
  {
    prefix: '@openzeppelin/contracts',
    localPath: path.join(LIBRARY_BASE, 'openzeppelin-contracts', 'contracts'),
    source: 'openzeppelin',
  },
  // Solady
  {
    prefix: 'solady',
    localPath: path.join(LIBRARY_BASE, 'solady', 'src'),
    source: 'solady',
  },
  // Avalanche ICM - foundry remappings
  {
    prefix: '@teleporter',
    localPath: path.join(LIBRARY_BASE, 'icm-contracts', 'avalanche', 'teleporter'),
    source: 'avalanche-icm',
  },
  {
    prefix: '@utilities',
    localPath: path.join(LIBRARY_BASE, 'icm-contracts', 'avalanche', 'utilities'),
    source: 'avalanche-icm',
  },
  {
    prefix: '@subnet-evm',
    localPath: path.join(LIBRARY_BASE, 'icm-contracts', 'avalanche', 'subnet-evm'),
    source: 'avalanche-icm',
  },
  {
    prefix: '@mocks',
    localPath: path.join(LIBRARY_BASE, 'icm-contracts', 'avalanche', 'mocks'),
    source: 'avalanche-icm',
  },
  {
    prefix: '@ictt',
    localPath: path.join(LIBRARY_BASE, 'icm-contracts', 'avalanche', 'ictt'),
    source: 'avalanche-icm',
  },
  {
    prefix: '@validator-manager',
    localPath: path.join(LIBRARY_BASE, 'icm-contracts', 'avalanche', 'validator-manager'),
    source: 'avalanche-icm',
  },
];

const LIBRARIES: LibraryConfig[] = [
  // OpenZeppelin
  {
    id: 'openzeppelin',
    name: 'OpenZeppelin Contracts',
    version: '5.0.0',
    localPath: path.join(LIBRARY_BASE, 'openzeppelin-contracts', 'contracts'),
    pathPrefix: '@openzeppelin/contracts',
    excludePaths: ['mocks', 'vendor', 'build', 'test', '.t.sol', '.s.sol'],
  },
  {
    id: 'openzeppelin-upgradeable',
    name: 'OpenZeppelin Upgradeable',
    version: '5.0.0',
    localPath: path.join(LIBRARY_BASE, 'openzeppelin-contracts-upgradeable', 'contracts'),
    pathPrefix: '@openzeppelin/contracts-upgradeable',
    excludePaths: ['mocks', 'vendor', 'build', 'test', '.t.sol', '.s.sol'],
  },
  // Solady
  {
    id: 'solady',
    name: 'Solady',
    version: 'latest',
    localPath: path.join(LIBRARY_BASE, 'solady', 'src'),
    pathPrefix: 'solady/src',
    excludePaths: ['test', '.t.sol', '.s.sol'],
  },
  // Avalanche ICM - with external dependency resolution
  // Use foundry-style remapping prefixes (@teleporter, @utilities, etc.)
  // to match user project imports
  {
    id: 'avalanche-teleporter',
    name: 'Avalanche Teleporter',
    version: '1.0.0',
    localPath: path.join(LIBRARY_BASE, 'icm-contracts', 'avalanche', 'teleporter'),
    pathPrefix: '@teleporter',
    excludePaths: ['mocks', 'test', 'tests', '.t.sol', '.s.sol'],
    resolveExternalDeps: true,
  },
  {
    id: 'avalanche-ictt',
    name: 'Avalanche ICTT',
    version: '1.0.0',
    localPath: path.join(LIBRARY_BASE, 'icm-contracts', 'avalanche', 'ictt'),
    pathPrefix: '@ictt',
    excludePaths: ['mocks', 'test', 'tests', '.t.sol', '.s.sol'],
    resolveExternalDeps: true,
  },
  {
    id: 'avalanche-validator-manager',
    name: 'Avalanche Validator Manager',
    version: '1.0.0',
    localPath: path.join(LIBRARY_BASE, 'icm-contracts', 'avalanche', 'validator-manager'),
    pathPrefix: '@validator-manager',
    excludePaths: ['mocks', 'test', 'tests', '.t.sol', '.s.sol'],
    resolveExternalDeps: true,
  },
  {
    id: 'avalanche-utilities',
    name: 'Avalanche Utilities',
    version: '1.0.0',
    localPath: path.join(LIBRARY_BASE, 'icm-contracts', 'avalanche', 'utilities'),
    pathPrefix: '@utilities',
    excludePaths: ['mocks', 'test', 'tests', '.t.sol', '.s.sol'],
    resolveExternalDeps: true,
  },
];

/**
 * Resolve external import path to a file system path
 * Handles versioned paths like @openzeppelin/contracts@5.0.2/... or @openzeppelin/contracts/@5.0.2/...
 */
function resolveExternalImport(importPath: string): { fullPath: string; source: ExternalLibraryMapping['source'] } | null {
  // Normalize the path - remove version patterns like @5.0.2 or -upgradeable@5.0.2
  let normalizedPath = importPath;

  // Handle patterns like @openzeppelin/contracts/@5.0.2/... or @openzeppelin/contracts-upgradeable@5.0.2/...
  normalizedPath = normalizedPath.replace(/@[\d.]+\//g, '/');  // @5.0.2/ -> /
  normalizedPath = normalizedPath.replace(/-upgradeable@[\d.]+\//g, '-upgradeable/');  // -upgradeable@5.0.2/ -> -upgradeable/
  normalizedPath = normalizedPath.replace(/\/\//g, '/');  // remove double slashes

  for (const mapping of EXTERNAL_LIBRARY_MAPPINGS) {
    if (normalizedPath.startsWith(mapping.prefix)) {
      const relativePath = normalizedPath.slice(mapping.prefix.length);
      const fullPath = path.join(mapping.localPath, relativePath);
      return { fullPath, source: mapping.source };
    }
  }
  return null;
}

/**
 * Resolve external dependencies for a list of contracts
 * Recursively resolves imports from OpenZeppelin, Solady, etc.
 */
function resolveExternalDependencies(
  contracts: Contract[],
  maxDepth: number = 5
): Contract[] {
  const allContracts = [...contracts];
  const processedPaths = new Set<string>();
  const pendingImports = new Set<string>();

  // Mark original contracts as processed
  for (const contract of contracts) {
    processedPaths.add(contract.filePath);
  }

  // Collect initial external imports
  for (const contract of contracts) {
    for (const imp of contract.imports) {
      if (imp.isExternal && !processedPaths.has(imp.path)) {
        pendingImports.add(imp.path);
      }
    }
  }

  let depth = 0;
  while (pendingImports.size > 0 && depth < maxDepth) {
    const currentBatch = [...pendingImports];
    pendingImports.clear();

    for (const importPath of currentBatch) {
      if (processedPaths.has(importPath)) {
        continue;
      }
      processedPaths.add(importPath);

      const resolved = resolveExternalImport(importPath);
      if (!resolved) {
        console.log(`  Could not resolve: ${importPath}`);
        continue;
      }

      if (!fs.existsSync(resolved.fullPath)) {
        console.log(`  File not found: ${resolved.fullPath}`);
        continue;
      }

      const content = fs.readFileSync(resolved.fullPath, 'utf-8');
      const { contracts: parsedContracts } = parseSolidityFile(importPath, content);

      for (const contract of parsedContracts) {
        // Mark as external library
        contract.filePath = importPath;
        contract.isExternalLibrary = true;
        contract.librarySource = resolved.source;
        allContracts.push(contract);

        // Collect nested external imports
        for (const imp of contract.imports) {
          if (imp.isExternal && !processedPaths.has(imp.path)) {
            pendingImports.add(imp.path);
          }
        }
      }
    }

    depth++;
  }

  if (pendingImports.size > 0) {
    console.log(`  Stopped resolving at depth ${maxDepth}. Remaining: ${pendingImports.size} imports`);
  }

  return allContracts;
}

function collectSolidityFiles(
  dirPath: string,
  excludePaths: string[],
  pathPrefix: string,
  basePath: string = ''
): { path: string; content: string }[] {
  const files: { path: string; content: string }[] = [];

  if (!fs.existsSync(dirPath)) {
    console.error(`Directory not found: ${dirPath}`);
    return files;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

    // Skip excluded paths
    if (excludePaths.some(exc =>
      entry.name.toLowerCase().includes(exc.toLowerCase()) ||
      relativePath.toLowerCase().includes(exc.toLowerCase())
    )) {
      continue;
    }

    if (entry.isDirectory()) {
      const subFiles = collectSolidityFiles(fullPath, excludePaths, pathPrefix, relativePath);
      files.push(...subFiles);
    } else if (
      entry.isFile() &&
      entry.name.endsWith('.sol') &&
      !entry.name.endsWith('.t.sol') &&
      !entry.name.endsWith('.s.sol') &&
      !entry.name.toLowerCase().includes('mock')
    ) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      files.push({
        path: `${pathPrefix}/${relativePath}`,
        content,
      });
    }
  }

  return files;
}

async function buildLibraryCache(config: LibraryConfig): Promise<void> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Building cache for: ${config.name}`);
  console.log(`Source: ${config.localPath}`);
  console.log(`${'='.repeat(60)}`);

  try {
    // Collect all Solidity files
    const files = collectSolidityFiles(config.localPath, config.excludePaths, config.pathPrefix);
    console.log(`\nCollected ${files.length} Solidity files`);

    if (files.length === 0) {
      console.error('No files found!');
      return;
    }

    // Parse contracts
    console.log('\nParsing contracts...');
    let contracts = parseSolidityFiles(files);
    console.log(`Parsed ${contracts.length} contracts`);

    // Resolve external dependencies if enabled
    if (config.resolveExternalDeps) {
      console.log('\nResolving external dependencies (OpenZeppelin, etc.)...');
      const originalCount = contracts.length;
      contracts = resolveExternalDependencies(contracts);
      const addedCount = contracts.length - originalCount;
      console.log(`Added ${addedCount} external dependency contracts`);
    }

    // Build call graph
    console.log('\nBuilding call graph...');
    const callGraph = buildCallGraph(config.name, contracts);

    // Save as JSON
    const outputDir = path.join(__dirname, '..', 'src', 'data', 'libraries');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const cacheData = {
      id: config.id,
      name: config.name,
      version: config.version,
      generatedAt: new Date().toISOString(),
      callGraph,
    };

    const outputPath = path.join(outputDir, `${config.id}-parsed.json`);
    fs.writeFileSync(outputPath, JSON.stringify(cacheData, null, 2));

    const fileSizeKB = (fs.statSync(outputPath).size / 1024).toFixed(2);
    console.log(`\nSaved to: ${outputPath}`);
    console.log(`File size: ${fileSizeKB} KB`);
    console.log(`Contracts: ${callGraph.stats.totalContracts}`);
    console.log(`Interfaces: ${callGraph.stats.totalInterfaces}`);
    console.log(`Libraries: ${callGraph.stats.totalLibraries}`);
    console.log(`Functions: ${callGraph.stats.totalFunctions}`);

  } catch (error) {
    console.error(`Error building cache for ${config.name}:`, error);
  }
}

async function main() {
  console.log('Sol-Flow Local Library Cache Builder');
  console.log('====================================\n');

  for (const config of LIBRARIES) {
    await buildLibraryCache(config);
  }

  console.log('\n\nDone!');
}

main().catch(console.error);
