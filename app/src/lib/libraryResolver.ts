import fs from 'fs';
import path from 'path';
import type { Contract } from '@/types/callGraph';
import { parseSolidityFile } from './solidityParser';
import {
  normalizeVersionedPath,
  findRemapping,
  type Remapping,
} from '@/config/remappings';

// Library directory path - try multiple possible locations
function getLibraryBasePath(): string {
  // Try relative to current working directory
  const cwdRelative = path.join(process.cwd(), '..', 'library');
  if (fs.existsSync(cwdRelative)) {
    return cwdRelative;
  }

  // Try relative to app directory (for production)
  const appRelative = path.resolve(__dirname, '..', '..', '..', '..', 'library');
  if (fs.existsSync(appRelative)) {
    return appRelative;
  }

  // Fallback to original path
  return cwdRelative;
}

const LIBRARY_BASE_PATH = getLibraryBasePath();

/**
 * Resolve an import path to a file system path
 * e.g., "@teleporter/TeleporterMessenger.sol" -> "/path/to/library/icm-services/icm-contracts/avalanche/teleporter/TeleporterMessenger.sol"
 */
function resolveImportPath(importPath: string): { fullPath: string; remapping: Remapping } | null {
  const normalized = normalizeVersionedPath(importPath);
  const remapping = findRemapping(normalized);

  if (!remapping) {
    return null;
  }

  const relativePath = normalized.slice(remapping.alias.length);
  const fullPath = path.join(LIBRARY_BASE_PATH, remapping.target, relativePath);

  return { fullPath, remapping };
}

/**
 * Check if a file is an interface and find its implementation
 * e.g., "ITeleporterMessenger.sol" -> "TeleporterMessenger.sol"
 */
function findImplementationForInterface(interfacePath: string): string | null {
  const fileName = path.basename(interfacePath, '.sol');

  // Check if it's an interface (starts with 'I' and second char is uppercase)
  if (fileName.startsWith('I') && fileName[1] === fileName[1]?.toUpperCase()) {
    const implName = fileName.slice(1); // Remove 'I' prefix
    const implPath = interfacePath.replace(`/${fileName}.sol`, `/${implName}.sol`);

    const resolved = resolveImportPath(implPath);
    if (resolved && fs.existsSync(resolved.fullPath)) {
      return implPath;
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
  } catch {
    // Failed to read file
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
      // Normalize for consistency
      const normalizedImportPath = normalizeVersionedPath(importPath);

      if (processedPaths.has(importPath) || processedPaths.has(normalizedImportPath)) {
        continue;
      }
      processedPaths.add(importPath);
      processedPaths.add(normalizedImportPath);

      const resolved = resolveImportPath(importPath);
      if (!resolved) {
        continue;
      }

      const content = readLibraryFile(resolved.fullPath);
      if (!content) {
        continue;
      }

      // Parse the library file - use the original import path as filePath
      // This ensures the path matches what user code imports
      const { contracts: libraryContracts } = parseSolidityFile(normalizedImportPath, content);

      for (const contract of libraryContracts) {
        // Keep the import path format for display and matching
        contract.filePath = normalizedImportPath;
        contract.isExternalLibrary = true;
        contract.librarySource = resolved.remapping.librarySource;
        allContracts.push(contract);

        // Collect nested external imports
        for (const imp of contract.imports) {
          if (imp.isExternal && !processedPaths.has(imp.path)) {
            pendingImports.add(imp.path);
          }
        }
      }

      // If this is an interface, also import the implementation file if it exists
      const implPath = findImplementationForInterface(importPath);
      if (implPath && !processedPaths.has(implPath)) {
        pendingImports.add(implPath);
      }
    }

    depth++;
  }

  return allContracts;
}
