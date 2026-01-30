/**
 * Standard remappings configuration for Solidity imports
 *
 * Maps foundry-style import aliases to actual file paths.
 * Example: @openzeppelin/contracts/X.sol -> openzeppelin-contracts/contracts/X.sol
 */

export interface Remapping {
  // Import alias used in Solidity (e.g., "@openzeppelin/contracts")
  alias: string;
  // Actual path relative to library root (e.g., "openzeppelin-contracts/contracts")
  target: string;
  // Library source identifier
  librarySource: 'openzeppelin' | 'openzeppelin-upgradeable' | 'solady';
  // GitHub info for "View on GitHub" links
  github?: {
    repo: string;
    branch: string;
    basePath: string;
  };
}

/**
 * Standard remappings matching foundry.toml conventions:
 *
 * @openzeppelin/contracts -> openzeppelin-contracts/contracts
 * @openzeppelin/contracts-upgradeable -> openzeppelin-contracts-upgradeable/contracts
 * solady -> solady/src
 */
export const STANDARD_REMAPPINGS: Remapping[] = [
  // OpenZeppelin (order matters - more specific first)
  {
    alias: '@openzeppelin/contracts-upgradeable',
    target: 'openzeppelin-contracts-upgradeable/contracts',
    librarySource: 'openzeppelin-upgradeable',
    github: {
      repo: 'OpenZeppelin/openzeppelin-contracts-upgradeable',
      branch: 'master',
      basePath: 'contracts',
    },
  },
  {
    alias: '@openzeppelin/contracts',
    target: 'openzeppelin-contracts/contracts',
    librarySource: 'openzeppelin',
    github: {
      repo: 'OpenZeppelin/openzeppelin-contracts',
      branch: 'master',
      basePath: 'contracts',
    },
  },
  // Solady
  {
    alias: 'solady',
    target: 'solady/src',
    librarySource: 'solady',
    github: {
      repo: 'Vectorized/solady',
      branch: 'main',
      basePath: 'src',
    },
  },
];

/**
 * Normalize versioned import paths
 * e.g., "@openzeppelin/contracts@5.0.2/access/..." -> "@openzeppelin/contracts/access/..."
 */
export function normalizeVersionedPath(importPath: string): string {
  let normalized = importPath;
  normalized = normalized.replace(/@\d+\.\d+\.\d+\//g, '/');
  normalized = normalized.replace(/-upgradeable@\d+\.\d+\.\d+\//g, '-upgradeable/');
  normalized = normalized.replace(/\/\//g, '/');
  return normalized;
}

/**
 * Find remapping for an import path
 */
export function findRemapping(importPath: string): Remapping | null {
  const normalized = normalizeVersionedPath(importPath);

  for (const remapping of STANDARD_REMAPPINGS) {
    if (normalized.startsWith(remapping.alias)) {
      return remapping;
    }
  }
  return null;
}

/**
 * Resolve import path to actual file path (relative to library root)
 * e.g., "@openzeppelin/contracts/token/ERC20/ERC20.sol" -> "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol"
 */
export function resolveImportToTarget(importPath: string): { targetPath: string; remapping: Remapping } | null {
  const normalized = normalizeVersionedPath(importPath);
  const remapping = findRemapping(normalized);

  if (!remapping) {
    return null;
  }

  const relativePath = normalized.slice(remapping.alias.length);
  const targetPath = remapping.target + relativePath;

  return { targetPath, remapping };
}

/**
 * Convert target path back to import alias format
 * e.g., "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol" -> "@openzeppelin/contracts/token/ERC20/ERC20.sol"
 */
export function targetToAlias(targetPath: string): string | null {
  for (const remapping of STANDARD_REMAPPINGS) {
    if (targetPath.startsWith(remapping.target)) {
      const relativePath = targetPath.slice(remapping.target.length);
      return remapping.alias + relativePath;
    }
  }
  return null;
}

/**
 * Get GitHub URL for a file path
 */
export function getGitHubUrlForPath(filePath: string, line?: number): string | null {
  const normalized = normalizeVersionedPath(filePath);
  const remapping = findRemapping(normalized);

  if (!remapping?.github) {
    return null;
  }

  const relativePath = normalized.slice(remapping.alias.length);
  // Remove leading slash
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;

  const url = `https://github.com/${remapping.github.repo}/blob/${remapping.github.branch}/${remapping.github.basePath}/${cleanPath}`;
  return line ? `${url}#L${line}` : url;
}

/**
 * Check if path is from an external library
 */
export function isExternalLibrary(filePath: string): boolean {
  return findRemapping(filePath) !== null;
}

/**
 * Library GitHub configurations for direct library viewing
 */
export const LIBRARY_GITHUB_CONFIG: Record<string, { repo: string; branch: string; basePath: string }> = {
  'openzeppelin': {
    repo: 'OpenZeppelin/openzeppelin-contracts',
    branch: 'master',
    basePath: 'contracts',
  },
  'openzeppelin-upgradeable': {
    repo: 'OpenZeppelin/openzeppelin-contracts-upgradeable',
    branch: 'master',
    basePath: 'contracts',
  },
  'solady': {
    repo: 'Vectorized/solady',
    branch: 'main',
    basePath: 'src',
  },
};

/**
 * Get GitHub URL for a library file path (when viewing a library directly)
 */
export function getGitHubUrlForLibrary(libraryId: string, filePath: string, line?: number): string | null {
  const config = LIBRARY_GITHUB_CONFIG[libraryId];
  if (!config) {
    return null;
  }

  // Clean up the file path (remove leading slashes)
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;

  const url = `https://github.com/${config.repo}/blob/${config.branch}/${config.basePath}/${cleanPath}`;
  return line ? `${url}#L${line}` : url;
}
