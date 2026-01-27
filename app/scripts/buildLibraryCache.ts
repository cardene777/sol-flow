/**
 * Script to build pre-parsed library cache
 * Run with: npx tsx scripts/buildLibraryCache.ts
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
  id: string;
  name: string;
  version: string;
  repo: string;
  branch: string;
  basePath: string;
  excludePaths: string[];
  includePaths?: string[]; // Only include these paths if specified
}

const LIBRARIES: LibraryConfig[] = [
  {
    id: 'openzeppelin',
    name: 'OpenZeppelin Contracts',
    version: '5.0.0',
    repo: 'OpenZeppelin/openzeppelin-contracts',
    branch: 'master',
    basePath: 'contracts',
    excludePaths: ['mocks', 'vendor', 'build'],
    // Only include main contract directories, exclude tests
    includePaths: ['access', 'finance', 'governance', 'interfaces', 'metatx', 'proxy', 'token', 'utils'],
  },
  {
    id: 'solady',
    name: 'Solady',
    version: 'latest',
    repo: 'Vectorized/solady',
    branch: 'main',
    basePath: 'src',
    excludePaths: ['test'],
    includePaths: ['accounts', 'auth', 'tokens', 'utils'],
  },
];

async function fetchGitHubDirectory(
  repo: string,
  branch: string,
  dirPath: string
): Promise<GitHubFile[]> {
  const url = `https://api.github.com/repos/${repo}/contents/${dirPath}?ref=${branch}`;
  console.log(`  Fetching: ${dirPath}`);

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'sol-flow-cache-builder',
    },
  });

  if (!response.ok) {
    if (response.status === 403) {
      const resetTime = response.headers.get('X-RateLimit-Reset');
      console.error(`Rate limited. Reset at: ${resetTime ? new Date(parseInt(resetTime) * 1000) : 'unknown'}`);
    }
    throw new Error(`Failed to fetch ${dirPath}: ${response.status}`);
  }

  // Add delay to avoid rate limiting
  await new Promise(resolve => setTimeout(resolve, 200));

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
  config: LibraryConfig
): Promise<{ path: string; content: string }[]> {
  const files: { path: string; content: string }[] = [];
  const queue: string[] = [];

  // Start with included paths if specified, otherwise base path
  if (config.includePaths) {
    for (const includePath of config.includePaths) {
      queue.push(`${config.basePath}/${includePath}`);
    }
  } else {
    queue.push(config.basePath);
  }

  while (queue.length > 0) {
    const currentPath = queue.shift()!;

    // Skip excluded paths
    if (config.excludePaths.some(exc => currentPath.toLowerCase().includes(exc.toLowerCase()))) {
      continue;
    }

    try {
      const entries = await fetchGitHubDirectory(config.repo, config.branch, currentPath);

      for (const entry of entries) {
        // Skip excluded paths
        if (config.excludePaths.some(exc => entry.path.toLowerCase().includes(exc.toLowerCase()))) {
          continue;
        }

        if (entry.type === 'dir') {
          queue.push(entry.path);
        } else if (
          entry.type === 'file' &&
          entry.name.endsWith('.sol') &&
          !entry.name.endsWith('.t.sol') &&
          !entry.name.endsWith('.s.sol') &&
          !entry.name.toLowerCase().includes('mock') &&
          entry.download_url
        ) {
          console.log(`    Downloading: ${entry.name}`);
          const content = await fetchFileContent(entry.download_url);
          files.push({
            path: entry.path,
            content,
          });

          // Delay between file downloads
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.error(`Error fetching ${currentPath}:`, error);
    }
  }

  return files;
}

async function buildLibraryCache(config: LibraryConfig): Promise<void> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Building cache for: ${config.name}`);
  console.log(`${'='.repeat(60)}`);

  try {
    const files = await collectSolidityFiles(config);
    console.log(`\nCollected ${files.length} Solidity files`);

    // Save raw files as JSON
    const cacheData = {
      id: config.id,
      name: config.name,
      version: config.version,
      repo: config.repo,
      generatedAt: new Date().toISOString(),
      fileCount: files.length,
      files,
    };

    const outputDir = path.join(__dirname, '..', 'src', 'data', 'libraries');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `${config.id}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(cacheData, null, 2));
    console.log(`\nSaved to: ${outputPath}`);
    console.log(`File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);

  } catch (error) {
    console.error(`Error building cache for ${config.name}:`, error);
  }
}

async function main() {
  console.log('Sol-Flow Library Cache Builder');
  console.log('==============================\n');
  console.log('This script fetches Solidity contracts from GitHub and caches them locally.');
  console.log('Note: GitHub API has rate limits (60 requests/hour unauthenticated).\n');

  const libraryId = process.argv[2];

  if (libraryId) {
    // Build specific library
    const config = LIBRARIES.find(l => l.id === libraryId);
    if (!config) {
      console.error(`Unknown library: ${libraryId}`);
      console.log('Available libraries:', LIBRARIES.map(l => l.id).join(', '));
      process.exit(1);
    }
    await buildLibraryCache(config);
  } else {
    // Build all libraries
    for (const config of LIBRARIES) {
      await buildLibraryCache(config);
    }
  }

  console.log('\n\nDone!');
}

main().catch(console.error);
