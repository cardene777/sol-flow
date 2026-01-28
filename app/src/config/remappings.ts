/**
 * Standard remappings configuration for Solidity imports
 *
 * Maps foundry-style import aliases to actual file paths.
 * Example: @teleporter/X.sol -> icm-services/icm-contracts/avalanche/teleporter/X.sol
 */

export interface Remapping {
  // Import alias used in Solidity (e.g., "@teleporter")
  alias: string;
  // Actual path relative to library root (e.g., "icm-services/icm-contracts/avalanche/teleporter")
  target: string;
  // Library source identifier
  librarySource: 'openzeppelin' | 'openzeppelin-upgradeable' | 'solady' | 'avalanche-icm';
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
 * @teleporter -> icm-services/icm-contracts/avalanche/teleporter
 * @utilities -> icm-services/icm-contracts/avalanche/utilities
 * @subnet-evm -> icm-services/icm-contracts/avalanche/subnet-evm
 * @mocks -> icm-services/icm-contracts/avalanche/mocks
 * @ictt -> icm-services/icm-contracts/avalanche/ictt
 * @validator-manager -> icm-services/icm-contracts/avalanche/validator-manager
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
  // Avalanche ICM - support multiple alias formats
  // Note: Using icm-services submodule which contains icm-contracts folder
  {
    alias: '@avalanche-icm/teleporter',
    target: 'icm-services/icm-contracts/avalanche/teleporter',
    librarySource: 'avalanche-icm',
    github: {
      repo: 'ava-labs/icm-services',
      branch: 'main',
      basePath: 'icm-contracts/avalanche/teleporter',
    },
  },
  {
    alias: '@teleporter',
    target: 'icm-services/icm-contracts/avalanche/teleporter',
    librarySource: 'avalanche-icm',
    github: {
      repo: 'ava-labs/icm-services',
      branch: 'main',
      basePath: 'icm-contracts/avalanche/teleporter',
    },
  },
  {
    alias: '@avalanche-icm/utilities',
    target: 'icm-services/icm-contracts/avalanche/utilities',
    librarySource: 'avalanche-icm',
    github: {
      repo: 'ava-labs/icm-services',
      branch: 'main',
      basePath: 'icm-contracts/avalanche/utilities',
    },
  },
  {
    alias: '@utilities',
    target: 'icm-services/icm-contracts/avalanche/utilities',
    librarySource: 'avalanche-icm',
    github: {
      repo: 'ava-labs/icm-services',
      branch: 'main',
      basePath: 'icm-contracts/avalanche/utilities',
    },
  },
  {
    alias: '@avalanche-icm/subnet-evm',
    target: 'icm-services/icm-contracts/avalanche/subnet-evm',
    librarySource: 'avalanche-icm',
    github: {
      repo: 'ava-labs/icm-services',
      branch: 'main',
      basePath: 'icm-contracts/avalanche/subnet-evm',
    },
  },
  {
    alias: '@subnet-evm',
    target: 'icm-services/icm-contracts/avalanche/subnet-evm',
    librarySource: 'avalanche-icm',
    github: {
      repo: 'ava-labs/icm-services',
      branch: 'main',
      basePath: 'icm-contracts/avalanche/subnet-evm',
    },
  },
  {
    alias: '@avalanche-icm/mocks',
    target: 'icm-services/icm-contracts/avalanche/mocks',
    librarySource: 'avalanche-icm',
    github: {
      repo: 'ava-labs/icm-services',
      branch: 'main',
      basePath: 'icm-contracts/avalanche/mocks',
    },
  },
  {
    alias: '@mocks',
    target: 'icm-services/icm-contracts/avalanche/mocks',
    librarySource: 'avalanche-icm',
    github: {
      repo: 'ava-labs/icm-services',
      branch: 'main',
      basePath: 'icm-contracts/avalanche/mocks',
    },
  },
  {
    alias: '@avalanche-icm/ictt',
    target: 'icm-services/icm-contracts/avalanche/ictt',
    librarySource: 'avalanche-icm',
    github: {
      repo: 'ava-labs/icm-services',
      branch: 'main',
      basePath: 'icm-contracts/avalanche/ictt',
    },
  },
  {
    alias: '@ictt',
    target: 'icm-services/icm-contracts/avalanche/ictt',
    librarySource: 'avalanche-icm',
    github: {
      repo: 'ava-labs/icm-services',
      branch: 'main',
      basePath: 'icm-contracts/avalanche/ictt',
    },
  },
  {
    alias: '@avalanche-icm/validator-manager',
    target: 'icm-services/icm-contracts/avalanche/validator-manager',
    librarySource: 'avalanche-icm',
    github: {
      repo: 'ava-labs/icm-services',
      branch: 'main',
      basePath: 'icm-contracts/avalanche/validator-manager',
    },
  },
  {
    alias: '@validator-manager',
    target: 'icm-services/icm-contracts/avalanche/validator-manager',
    librarySource: 'avalanche-icm',
    github: {
      repo: 'ava-labs/icm-services',
      branch: 'main',
      basePath: 'icm-contracts/avalanche/validator-manager',
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
 * e.g., "@teleporter/TeleporterMessenger.sol" -> "icm-services/icm-contracts/avalanche/teleporter/TeleporterMessenger.sol"
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
 * e.g., "icm-services/icm-contracts/avalanche/teleporter/TeleporterMessenger.sol" -> "@teleporter/TeleporterMessenger.sol"
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
