import fs from 'fs';
import path from 'path';
import type { Contract, ImportInfo } from '@/types/callGraph';
import { parseSolidityFile } from './solidityParser';

// Library directory path (relative to project root)
const LIBRARY_BASE_PATH = path.join(process.cwd(), '..', 'library');

// Mapping from import paths to library directories
const LIBRARY_MAPPINGS: Record<string, string> = {
  '@openzeppelin/contracts': 'openzeppelin-contracts/contracts',
  '@openzeppelin/contracts-upgradeable': 'openzeppelin-contracts-upgradeable/contracts',
  'solady': 'solady',
};

/**
 * Resolve an external import path to a file system path
 */
function resolveImportPath(importPath: string): string | null {
  for (const [prefix, localPath] of Object.entries(LIBRARY_MAPPINGS)) {
    if (importPath.startsWith(prefix)) {
      const relativePath = importPath.slice(prefix.length);
      const fullPath = path.join(LIBRARY_BASE_PATH, localPath, relativePath);
      return fullPath;
    }
  }
  return null;
}

/**
 * Read a Solidity file from the library directory
 */
function readLibraryFile(filePath: string): string | null {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
  } catch (error) {
    console.error(`Failed to read library file: ${filePath}`, error);
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
 * Recursively resolve library dependencies
 */
export function resolveLibraryDependencies(
  uploadedContracts: Contract[],
  maxDepth: number = 5
): Contract[] {
  const allContracts = [...uploadedContracts];
  const processedPaths = new Set<string>();
  const pendingImports = new Set<string>();

  // Mark uploaded files as processed
  for (const contract of uploadedContracts) {
    processedPaths.add(contract.filePath);
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
      if (processedPaths.has(importPath)) {
        continue;
      }
      processedPaths.add(importPath);

      const resolvedPath = resolveImportPath(importPath);
      if (!resolvedPath) {
        console.log(`Could not resolve library path: ${importPath}`);
        continue;
      }

      const content = readLibraryFile(resolvedPath);
      if (!content) {
        console.log(`Could not read library file: ${resolvedPath}`);
        continue;
      }

      // Parse the library file
      const { contracts: libraryContracts } = parseSolidityFile(importPath, content);

      for (const contract of libraryContracts) {
        // Mark as external library
        contract.filePath = importPath; // Keep the original import path for display
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
    console.log(`Stopped resolving libraries at depth ${maxDepth}. Remaining: ${pendingImports.size} imports`);
  }

  console.log(`=== Library Resolution ===`);
  console.log(`Uploaded contracts: ${uploadedContracts.length}`);
  console.log(`Total contracts (with libraries): ${allContracts.length}`);
  console.log(`Library contracts added: ${allContracts.length - uploadedContracts.length}`);
  console.log(`==========================`);

  return allContracts;
}
