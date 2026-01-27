/**
 * Script to fetch and parse library contracts from GitHub
 * Run with: npx tsx scripts/generateLibraries.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  download_url: string | null;
}

interface LibraryConfig {
  name: string;
  version: string;
  repo: string;
  branch: string;
  basePath: string;
  outputFile: string;
  excludePaths: string[];
}

const LIBRARIES: LibraryConfig[] = [
  {
    name: 'OpenZeppelin Contracts',
    version: '5.0.0',
    repo: 'OpenZeppelin/openzeppelin-contracts',
    branch: 'master',
    basePath: 'contracts',
    outputFile: 'openzeppelin-5.0.json',
    excludePaths: ['mocks', 'test', 'vendor'],
  },
  {
    name: 'OpenZeppelin Contracts Upgradeable',
    version: '5.0.0',
    repo: 'OpenZeppelin/openzeppelin-contracts-upgradeable',
    branch: 'master',
    basePath: 'contracts',
    outputFile: 'openzeppelin-upgradeable-5.0.json',
    excludePaths: ['mocks', 'test'],
  },
  {
    name: 'Solady',
    version: 'latest',
    repo: 'Vectorized/solady',
    branch: 'main',
    basePath: 'src',
    outputFile: 'solady.json',
    excludePaths: ['test'],
  },
];

async function fetchGitHubDirectory(
  repo: string,
  branch: string,
  dirPath: string
): Promise<GitHubFile[]> {
  const url = `https://api.github.com/repos/${repo}/contents/${dirPath}?ref=${branch}`;
  console.log(`Fetching: ${url}`);

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'sol-flow-library-generator',
    },
  });

  if (!response.ok) {
    if (response.status === 403) {
      console.error('GitHub API rate limit exceeded. Try again later or use a token.');
    }
    throw new Error(`Failed to fetch ${dirPath}: ${response.status}`);
  }

  return response.json();
}

async function fetchFileContent(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status}`);
  }
  return response.text();
}

async function collectSolidityFiles(
  repo: string,
  branch: string,
  dirPath: string,
  excludePaths: string[]
): Promise<{ path: string; content: string }[]> {
  const files: { path: string; content: string }[] = [];

  const entries = await fetchGitHubDirectory(repo, branch, dirPath);

  for (const entry of entries) {
    // Skip excluded paths
    if (excludePaths.some(exc => entry.path.includes(exc))) {
      continue;
    }

    if (entry.type === 'dir') {
      // Recursively fetch subdirectory
      const subFiles = await collectSolidityFiles(repo, branch, entry.path, excludePaths);
      files.push(...subFiles);
    } else if (entry.type === 'file' && entry.name.endsWith('.sol') && entry.download_url) {
      // Skip test and mock files
      if (entry.name.endsWith('.t.sol') || entry.name.endsWith('.s.sol')) {
        continue;
      }

      console.log(`  Downloading: ${entry.path}`);
      const content = await fetchFileContent(entry.download_url);
      files.push({ path: entry.path, content });

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return files;
}

async function generateLibraryData(config: LibraryConfig): Promise<void> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Processing: ${config.name}`);
  console.log(`${'='.repeat(60)}`);

  try {
    // Collect all Solidity files
    const files = await collectSolidityFiles(
      config.repo,
      config.branch,
      config.basePath,
      config.excludePaths
    );

    console.log(`\nCollected ${files.length} files`);

    // Create library data structure (raw files for now)
    const libraryData = {
      name: config.name,
      version: config.version,
      repo: config.repo,
      generatedAt: new Date().toISOString(),
      files: files.map(f => ({
        path: f.path,
        content: f.content,
      })),
    };

    // Write to output file
    const outputPath = path.join(__dirname, '..', 'src', 'data', 'libraries', config.outputFile);
    fs.writeFileSync(outputPath, JSON.stringify(libraryData, null, 2));
    console.log(`\nWritten to: ${outputPath}`);

  } catch (error) {
    console.error(`Error processing ${config.name}:`, error);
  }
}

async function main() {
  console.log('Sol-Flow Library Generator');
  console.log('==========================\n');

  // Process each library
  for (const config of LIBRARIES) {
    await generateLibraryData(config);
  }

  console.log('\n\nDone! Now run the parser to generate parsed data.');
}

main().catch(console.error);
