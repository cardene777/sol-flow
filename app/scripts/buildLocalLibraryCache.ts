/**
 * Script to build pre-parsed library cache from local files
 * Run with: npx tsx scripts/buildLocalLibraryCache.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseSolidityFiles } from '../src/lib/solidityParser';
import { buildCallGraph } from '../src/lib/callGraphBuilder';

interface LibraryConfig {
  id: string;
  name: string;
  version: string;
  localPath: string;
  pathPrefix: string;
  excludePaths: string[];
}

const LIBRARY_BASE = path.join(__dirname, '..', '..', 'library');

const LIBRARIES: LibraryConfig[] = [
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
  {
    id: 'solady',
    name: 'Solady',
    version: 'latest',
    localPath: path.join(LIBRARY_BASE, 'solady', 'src'),
    pathPrefix: 'solady/src',
    excludePaths: ['test', '.t.sol', '.s.sol'],
  },
];

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
    const contracts = parseSolidityFiles(files);
    console.log(`Parsed ${contracts.length} contracts`);

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
