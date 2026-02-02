import { NextRequest, NextResponse } from 'next/server';

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
}

const LIBRARIES: Record<string, LibraryConfig> = {
  'openzeppelin': {
    id: 'openzeppelin',
    name: 'OpenZeppelin Contracts',
    version: '5.0.0',
    repo: 'OpenZeppelin/openzeppelin-contracts',
    branch: 'master',
    basePath: 'contracts',
    excludePaths: ['mocks', 'vendor'],
  },
  'openzeppelin-upgradeable': {
    id: 'openzeppelin-upgradeable',
    name: 'OpenZeppelin Upgradeable',
    version: '5.0.0',
    repo: 'OpenZeppelin/openzeppelin-contracts-upgradeable',
    branch: 'master',
    basePath: 'contracts',
    excludePaths: ['mocks'],
  },
  'solady': {
    id: 'solady',
    name: 'Solady',
    version: 'latest',
    repo: 'Vectorized/solady',
    branch: 'main',
    basePath: 'src',
    excludePaths: ['test'],
  },
  'sample-uups': {
    id: 'sample-uups',
    name: 'UUPS Proxy Sample',
    version: '1.0.0',
    repo: 'local',
    branch: 'main',
    basePath: 'samples/uups',
    excludePaths: [],
  },
  'sample-transparent': {
    id: 'sample-transparent',
    name: 'Transparent Proxy Sample',
    version: '1.0.0',
    repo: 'local',
    branch: 'main',
    basePath: 'samples/transparent',
    excludePaths: [],
  },
  'sample-diamond': {
    id: 'sample-diamond',
    name: 'Diamond Proxy Sample',
    version: '1.0.0',
    repo: 'local',
    branch: 'main',
    basePath: 'samples/diamond',
    excludePaths: [],
  },
  'sample-beacon': {
    id: 'sample-beacon',
    name: 'Beacon Proxy Sample',
    version: '1.0.0',
    repo: 'local',
    branch: 'main',
    basePath: 'samples/beacon',
    excludePaths: [],
  },
};

async function fetchGitHubDirectory(
  repo: string,
  branch: string,
  dirPath: string
): Promise<GitHubFile[]> {
  const url = `https://api.github.com/repos/${repo}/contents/${dirPath}?ref=${branch}`;

  // Build headers with optional authentication
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'sol-flow',
  };

  // Use GitHub token if available (increases rate limit from 60 to 5000 requests/hour)
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(url, {
    headers,
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('GitHub API rate limit exceeded');
    }
    throw new Error(`Failed to fetch: ${response.status}`);
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
  excludePaths: string[],
  maxFiles: number = 100
): Promise<{ path: string; content: string }[]> {
  const files: { path: string; content: string }[] = [];
  const queue: string[] = [dirPath];

  while (queue.length > 0 && files.length < maxFiles) {
    const currentPath = queue.shift()!;

    // Skip excluded paths
    if (excludePaths.some(exc => currentPath.includes(exc))) {
      continue;
    }

    try {
      const entries = await fetchGitHubDirectory(repo, branch, currentPath);

      for (const entry of entries) {
        if (files.length >= maxFiles) break;

        if (excludePaths.some(exc => entry.path.includes(exc))) {
          continue;
        }

        if (entry.type === 'dir') {
          queue.push(entry.path);
        } else if (
          entry.type === 'file' &&
          entry.name.endsWith('.sol') &&
          !entry.name.endsWith('.t.sol') &&
          !entry.name.endsWith('.s.sol') &&
          entry.download_url
        ) {
          const content = await fetchFileContent(entry.download_url);
          files.push({
            path: entry.path,
            content,
          });
        }
      }
    } catch {
      // Skip files that fail to fetch
    }
  }

  return files;
}

// GET /api/libraries - List available libraries
export async function GET() {
  const libraries = Object.values(LIBRARIES).map(lib => ({
    id: lib.id,
    name: lib.name,
    version: lib.version,
  }));

  return NextResponse.json({ libraries });
}

// POST /api/libraries - Fetch library files
export async function POST(request: NextRequest) {
  try {
    const { libraryId } = await request.json();

    const config = LIBRARIES[libraryId];
    if (!config) {
      return NextResponse.json(
        { error: 'Library not found' },
        { status: 404 }
      );
    }

    const files = await collectSolidityFiles(
      config.repo,
      config.branch,
      config.basePath,
      config.excludePaths,
      150 // Limit files to avoid timeout
    );

    return NextResponse.json({
      library: {
        id: config.id,
        name: config.name,
        version: config.version,
      },
      files,
    });
  } catch (error) {
    // Log error server-side for debugging
    console.error('Library fetch error:', error);
    // Return generic message to client to avoid information leakage
    return NextResponse.json(
      { error: 'Failed to fetch library' },
      { status: 500 }
    );
  }
}
