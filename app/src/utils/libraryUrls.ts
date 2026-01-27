/**
 * Utility to generate GitHub URLs for library contracts
 */

interface LibraryUrlConfig {
  prefix: string;
  repo: string;
  branch: string;
  basePath: string;
}

const LIBRARY_CONFIGS: LibraryUrlConfig[] = [
  {
    prefix: '@openzeppelin/contracts-upgradeable/',
    repo: 'OpenZeppelin/openzeppelin-contracts-upgradeable',
    branch: 'master',
    basePath: 'contracts',
  },
  {
    prefix: '@openzeppelin/contracts/',
    repo: 'OpenZeppelin/openzeppelin-contracts',
    branch: 'master',
    basePath: 'contracts',
  },
  {
    prefix: 'solady/src/',
    repo: 'Vectorized/solady',
    branch: 'main',
    basePath: 'src',
  },
];

export function getGitHubUrl(filePath: string, line?: number): string | null {
  for (const config of LIBRARY_CONFIGS) {
    if (filePath.startsWith(config.prefix)) {
      const relativePath = filePath.slice(config.prefix.length);
      const url = `https://github.com/${config.repo}/blob/${config.branch}/${config.basePath}/${relativePath}`;
      return line ? `${url}#L${line}` : url;
    }
  }
  return null;
}

export function isLibraryContract(filePath: string): boolean {
  return LIBRARY_CONFIGS.some(config => filePath.startsWith(config.prefix));
}
