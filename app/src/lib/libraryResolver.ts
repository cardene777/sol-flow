import type { Contract } from '@/types/callGraph';
import {
  normalizeVersionedPath,
  findRemapping,
  type Remapping,
} from '@/config/remappings';

// Pre-parsed library data cache
let libraryContractsCache: Map<string, Contract[]> | null = null;
let libraryContractsByPath: Map<string, Contract> | null = null;

/**
 * Library source to library ID mapping
 */
const LIBRARY_SOURCE_TO_ID: Record<string, string[]> = {
  'openzeppelin': ['openzeppelin'],
  'openzeppelin-upgradeable': ['openzeppelin-upgradeable'],
  'solady': ['solady'],
};

/**
 * Load all pre-parsed library contracts
 */
async function loadAllLibraryContracts(): Promise<Map<string, Contract[]>> {
  if (libraryContractsCache) {
    return libraryContractsCache;
  }

  const cache = new Map<string, Contract[]>();
  const byPath = new Map<string, Contract>();

  // Dynamically import all library JSON files
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const libraryImports: Record<string, () => Promise<any>> = {
    'openzeppelin': () => import('@/data/libraries/openzeppelin-parsed.json'),
    'openzeppelin-upgradeable': () => import('@/data/libraries/openzeppelin-upgradeable-parsed.json'),
    'solady': () => import('@/data/libraries/solady-parsed.json'),
  };

  for (const [libraryId, importFn] of Object.entries(libraryImports)) {
    try {
      const module = await importFn();
      const data = module.default || module;
      if (data?.callGraph?.contracts) {
        const contracts = data.callGraph.contracts as Contract[];
        cache.set(libraryId, contracts);

        // Index contracts by file path for fast lookup
        for (const contract of contracts) {
          if (contract.filePath) {
            byPath.set(contract.filePath, contract);
            // Also index by normalized path
            const normalized = normalizeVersionedPath(contract.filePath);
            if (normalized !== contract.filePath) {
              byPath.set(normalized, contract);
            }
          }
        }
      }
    } catch (e) {
      console.warn(`Failed to load library ${libraryId}:`, e);
    }
  }

  libraryContractsCache = cache;
  libraryContractsByPath = byPath;
  return cache;
}

/**
 * Find a contract by its import path in pre-parsed libraries
 */
async function findContractByImportPath(importPath: string): Promise<{ contract: Contract; remapping: Remapping } | null> {
  const normalized = normalizeVersionedPath(importPath);
  const remapping = findRemapping(normalized);

  if (!remapping) {
    return null;
  }

  await loadAllLibraryContracts();

  if (!libraryContractsByPath) {
    return null;
  }

  // Try to find contract by file path
  // The pre-parsed data stores contracts with their import path as filePath
  let contract = libraryContractsByPath.get(normalized);

  if (!contract) {
    // Try without leading slash
    const withoutSlash = normalized.startsWith('/') ? normalized.slice(1) : normalized;
    contract = libraryContractsByPath.get(withoutSlash);
  }

  if (!contract) {
    // Try to find by matching the end of the path (contract name)
    const fileName = normalized.split('/').pop()?.replace('.sol', '');
    if (fileName && libraryContractsCache) {
      const libraryIds = LIBRARY_SOURCE_TO_ID[remapping.librarySource] || [];
      for (const libraryId of libraryIds) {
        const contracts = libraryContractsCache.get(libraryId);
        if (contracts) {
          // Find contract with matching name
          contract = contracts.find(c => c.name === fileName);
          if (contract) break;

          // Also try matching by file path ending
          contract = contracts.find(c => c.filePath?.endsWith(normalized.split('/').slice(-2).join('/')));
          if (contract) break;
        }
      }
    }
  }

  if (contract) {
    return { contract, remapping };
  }

  return null;
}

/**
 * Extract all external imports from contracts
 */
function extractExternalImports(contracts: Contract[]): Set<string> {
  const externalImports = new Set<string>();

  for (const contract of contracts) {
    for (const imp of contract.imports) {
      if (imp.isExternal) {
        externalImports.add(imp.path);
      }
    }
  }

  return externalImports;
}

/**
 * Recursively resolve library dependencies using pre-parsed library data
 */
export async function resolveLibraryDependencies(
  uploadedContracts: Contract[],
  maxDepth: number = 5
): Promise<Contract[]> {
  const allContracts = [...uploadedContracts];
  const processedPaths = new Set<string>();
  const processedNames = new Set<string>();
  const pendingImports = new Set<string>();

  // Mark uploaded files as processed
  for (const contract of uploadedContracts) {
    processedPaths.add(contract.filePath);
    processedNames.add(contract.name);
  }

  // Collect initial external imports
  for (const imp of extractExternalImports(uploadedContracts)) {
    pendingImports.add(imp);
  }

  let depth = 0;
  while (pendingImports.size > 0 && depth < maxDepth) {
    const currentBatch = [...pendingImports];
    pendingImports.clear();

    for (const importPath of currentBatch) {
      // Normalize for consistency
      const normalizedImportPath = normalizeVersionedPath(importPath);

      if (processedPaths.has(importPath) || processedPaths.has(normalizedImportPath)) {
        continue;
      }
      processedPaths.add(importPath);
      processedPaths.add(normalizedImportPath);

      // Find contract in pre-parsed libraries
      const result = await findContractByImportPath(importPath);
      if (!result) {
        continue;
      }

      const { contract: libraryContract, remapping } = result;

      // Skip if we already have a contract with this name
      if (processedNames.has(libraryContract.name)) {
        continue;
      }
      processedNames.add(libraryContract.name);

      // Clone the contract and mark it as external library
      const contractCopy: Contract = {
        ...libraryContract,
        filePath: normalizedImportPath,
        isExternalLibrary: true,
        librarySource: remapping.librarySource,
      };

      allContracts.push(contractCopy);

      // Collect nested external imports
      for (const imp of contractCopy.imports) {
        if (imp.isExternal && !processedPaths.has(imp.path)) {
          pendingImports.add(imp.path);
        }
      }
    }

    depth++;
  }

  return allContracts;
}

// Synchronous version that uses cached data (for use after initial load)
export function resolveLibraryDependenciesSync(
  uploadedContracts: Contract[],
  maxDepth: number = 5
): Contract[] {
  // If cache is not loaded, return uploaded contracts as-is
  // The async version should be called first to populate the cache
  if (!libraryContractsCache || !libraryContractsByPath) {
    console.warn('Library cache not loaded. Call resolveLibraryDependencies first.');
    return uploadedContracts;
  }

  const allContracts = [...uploadedContracts];
  const processedPaths = new Set<string>();
  const processedNames = new Set<string>();
  const pendingImports = new Set<string>();

  // Mark uploaded files as processed
  for (const contract of uploadedContracts) {
    processedPaths.add(contract.filePath);
    processedNames.add(contract.name);
  }

  // Collect initial external imports
  for (const imp of extractExternalImports(uploadedContracts)) {
    pendingImports.add(imp);
  }

  let depth = 0;
  while (pendingImports.size > 0 && depth < maxDepth) {
    const currentBatch = [...pendingImports];
    pendingImports.clear();

    for (const importPath of currentBatch) {
      const normalizedImportPath = normalizeVersionedPath(importPath);

      if (processedPaths.has(importPath) || processedPaths.has(normalizedImportPath)) {
        continue;
      }
      processedPaths.add(importPath);
      processedPaths.add(normalizedImportPath);

      const remapping = findRemapping(normalizedImportPath);
      if (!remapping) {
        continue;
      }

      // Try to find contract by file path
      let libraryContract = libraryContractsByPath.get(normalizedImportPath);

      if (!libraryContract) {
        // Try to find by matching the end of the path (contract name)
        const fileName = normalizedImportPath.split('/').pop()?.replace('.sol', '');
        if (fileName) {
          const libraryIds = LIBRARY_SOURCE_TO_ID[remapping.librarySource] || [];
          for (const libraryId of libraryIds) {
            const contracts = libraryContractsCache.get(libraryId);
            if (contracts) {
              libraryContract = contracts.find(c => c.name === fileName);
              if (libraryContract) break;
            }
          }
        }
      }

      if (!libraryContract) {
        continue;
      }

      // Skip if we already have a contract with this name
      if (processedNames.has(libraryContract.name)) {
        continue;
      }
      processedNames.add(libraryContract.name);

      // Clone the contract and mark it as external library
      const contractCopy: Contract = {
        ...libraryContract,
        filePath: normalizedImportPath,
        isExternalLibrary: true,
        librarySource: remapping.librarySource,
      };

      allContracts.push(contractCopy);

      // Collect nested external imports
      for (const imp of contractCopy.imports) {
        if (imp.isExternal && !processedPaths.has(imp.path)) {
          pendingImports.add(imp.path);
        }
      }
    }

    depth++;
  }

  return allContracts;
}

/**
 * Preload library data (call this on app startup)
 */
export async function preloadLibraryData(): Promise<void> {
  await loadAllLibraryContracts();
}
