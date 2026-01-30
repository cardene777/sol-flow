import { NextRequest, NextResponse } from 'next/server';
import type { Contract, CallGraph, Dependency, DependencyType } from '@/types/callGraph';
import { AVAILABLE_LIBRARIES } from '@/data/libraries';

// Import all library data statically (Next.js requires static imports for bundling)
import openzeppelinData from '@/data/libraries/openzeppelin-parsed.json';
import openzeppelinUpgradeableData from '@/data/libraries/openzeppelin-upgradeable-parsed.json';
import soladyData from '@/data/libraries/solady-parsed.json';
import sampleUupsData from '@/data/libraries/sample-uups-parsed.json';
import sampleTransparentData from '@/data/libraries/sample-transparent-parsed.json';
import sampleDiamondData from '@/data/libraries/sample-diamond-parsed.json';
import sampleBeaconData from '@/data/libraries/sample-beacon-parsed.json';
import sampleErc7546Data from '@/data/libraries/sample-erc7546-parsed.json';

// Map of library IDs to their data
const libraryDataMap: Record<string, unknown> = {
  'openzeppelin': openzeppelinData,
  'openzeppelin-upgradeable': openzeppelinUpgradeableData,
  'solady': soladyData,
  'sample-uups': sampleUupsData,
  'sample-transparent': sampleTransparentData,
  'sample-diamond': sampleDiamondData,
  'sample-beacon': sampleBeaconData,
  'sample-erc7546': sampleErc7546Data,
};

// Map import path prefixes to library IDs
const IMPORT_PATH_TO_LIBRARY: Record<string, string> = {
  '@openzeppelin/contracts-upgradeable/': 'openzeppelin-upgradeable',
  '@openzeppelin/contracts/': 'openzeppelin',
};

// Sample libraries that need dependency resolution
const SAMPLE_LIBRARIES = new Set([
  'sample-uups',
  'sample-transparent',
  'sample-diamond',
  'sample-beacon',
  'sample-erc7546',
]);

/**
 * Extract required library IDs from contract imports
 */
function getRequiredLibraries(contracts: Contract[]): Set<string> {
  const requiredLibs = new Set<string>();

  for (const contract of contracts) {
    for (const imp of contract.imports || []) {
      if (imp.isExternal) {
        for (const [prefix, libId] of Object.entries(IMPORT_PATH_TO_LIBRARY)) {
          if (imp.path.startsWith(prefix)) {
            requiredLibs.add(libId);
            break;
          }
        }
      }
    }
  }

  return requiredLibs;
}

/**
 * Find a contract in library by matching the import path
 */
function findContractByImportPath(
  contracts: Contract[],
  importPath: string
): Contract | undefined {
  // Extract the contract name from the import path
  // e.g., "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol" -> "UUPSUpgradeable"
  const fileName = importPath.split('/').pop()?.replace('.sol', '');
  if (!fileName) return undefined;

  // Find contract with matching name and verify path matches
  return contracts.find(c => {
    if (c.name !== fileName) return false;
    // Also verify the path somewhat matches (in case of name collisions)
    const normalizedImportPath = importPath.toLowerCase();
    const normalizedFilePath = c.filePath.toLowerCase();
    // Check if the end of the paths match
    const pathParts = normalizedImportPath.split('/').slice(-3).join('/');
    return normalizedFilePath.includes(pathParts.replace('.sol', ''));
  });
}

/**
 * Merge library contracts and generate dependencies
 */
function mergeWithDependencies(
  sampleCallGraph: CallGraph,
  libraryCallGraphsWithIds: Array<{ callGraph: CallGraph; libraryId: string }>
): CallGraph {
  // Collect all library contracts with their library source
  const libraryContractsMap = new Map<string, Contract>();
  for (const { callGraph: libGraph, libraryId } of libraryCallGraphsWithIds) {
    // Map library ID to librarySource type
    const librarySource = libraryId as Contract['librarySource'];

    for (const contract of libGraph.contracts) {
      // Mark as external library with proper librarySource
      const markedContract: Contract = {
        ...contract,
        isExternalLibrary: true,
        librarySource,
      };
      libraryContractsMap.set(contract.name, markedContract);
    }
  }

  // Track which library contracts are actually needed
  const neededLibraryContracts = new Set<string>();
  const dependencies: Dependency[] = [];
  const addedDeps = new Set<string>();

  const addDependency = (from: string, to: string, type: DependencyType) => {
    if (from === to) return;
    const key = `${from}->${to}:${type}`;
    if (!addedDeps.has(key)) {
      addedDeps.add(key);
      dependencies.push({ from, to, type });
    }
  };

  // Process sample contracts to find needed library contracts
  const sampleContracts = sampleCallGraph.contracts;

  // Build a map for quick lookup
  const allContractsMap = new Map<string, Contract>();
  for (const c of sampleContracts) {
    allContractsMap.set(c.name, c);
  }

  // First pass: find direct dependencies from inherits
  for (const contract of sampleContracts) {
    for (const parentName of contract.inherits || []) {
      // Check if parent is in sample contracts
      if (allContractsMap.has(parentName)) {
        addDependency(contract.name, parentName, 'inherits');
        continue;
      }

      // Check if parent is in library contracts
      if (libraryContractsMap.has(parentName)) {
        neededLibraryContracts.add(parentName);
        addDependency(contract.name, parentName, 'inherits');
      }
    }

    for (const ifaceName of contract.implements || []) {
      if (allContractsMap.has(ifaceName)) {
        addDependency(contract.name, ifaceName, 'implements');
        continue;
      }
      if (libraryContractsMap.has(ifaceName)) {
        neededLibraryContracts.add(ifaceName);
        addDependency(contract.name, ifaceName, 'implements');
      }
    }

    // Find library calls from function calls
    const allFunctions = [
      ...(contract.externalFunctions || []),
      ...(contract.internalFunctions || []),
    ];
    for (const func of allFunctions) {
      for (const call of func.calls || []) {
        if (call.type === 'library' && call.target?.includes('.')) {
          const [libName] = call.target.split('.');
          // Check if library is in sample contracts (local library)
          if (allContractsMap.has(libName)) {
            addDependency(contract.name, libName, 'uses');
          }
          // Check if library is in external library contracts
          else if (libraryContractsMap.has(libName)) {
            neededLibraryContracts.add(libName);
            addDependency(contract.name, libName, 'uses');
          }
        }
      }
    }
  }

  // Second pass: recursively find library contract dependencies
  let foundNew = true;
  while (foundNew) {
    foundNew = false;
    for (const contractName of neededLibraryContracts) {
      const contract = libraryContractsMap.get(contractName);
      if (!contract) continue;

      for (const parentName of contract.inherits || []) {
        if (libraryContractsMap.has(parentName) && !neededLibraryContracts.has(parentName)) {
          neededLibraryContracts.add(parentName);
          addDependency(contractName, parentName, 'inherits');
          foundNew = true;
        }
      }

      for (const ifaceName of contract.implements || []) {
        if (libraryContractsMap.has(ifaceName) && !neededLibraryContracts.has(ifaceName)) {
          neededLibraryContracts.add(ifaceName);
          addDependency(contractName, ifaceName, 'implements');
          foundNew = true;
        }
      }
    }
  }

  // Add dependencies between needed library contracts
  for (const contractName of neededLibraryContracts) {
    const contract = libraryContractsMap.get(contractName);
    if (!contract) continue;

    for (const parentName of contract.inherits || []) {
      if (neededLibraryContracts.has(parentName)) {
        addDependency(contractName, parentName, 'inherits');
      }
    }

    for (const ifaceName of contract.implements || []) {
      if (neededLibraryContracts.has(ifaceName)) {
        addDependency(contractName, ifaceName, 'implements');
      }
    }
  }

  // Build merged contracts array
  const mergedContracts = [
    ...sampleContracts,
    ...[...neededLibraryContracts].map(name => libraryContractsMap.get(name)!).filter(Boolean),
  ];

  // Update stats
  const stats = {
    totalContracts: mergedContracts.filter(c => c.kind === 'contract' || c.kind === 'abstract').length,
    totalLibraries: mergedContracts.filter(c => c.kind === 'library').length,
    totalInterfaces: mergedContracts.filter(c => c.kind === 'interface').length,
    totalFunctions: mergedContracts.reduce(
      (sum, c) => sum + (c.externalFunctions?.length || 0) + (c.internalFunctions?.length || 0),
      0
    ),
  };

  return {
    ...sampleCallGraph,
    contracts: mergedContracts,
    dependencies,
    stats,
  };
}

/**
 * Process local dependencies for samples without external libraries
 * This creates 'uses' dependencies from library calls within the sample
 */
function processLocalDependencies(callGraph: CallGraph): CallGraph {
  const dependencies: Dependency[] = [...(callGraph.dependencies || [])];
  const addedDeps = new Set<string>();

  // Track existing dependencies
  for (const dep of dependencies) {
    addedDeps.add(`${dep.from}->${dep.to}:${dep.type}`);
  }

  const addDependency = (from: string, to: string, type: DependencyType) => {
    if (from === to) return;
    const key = `${from}->${to}:${type}`;
    if (!addedDeps.has(key)) {
      addedDeps.add(key);
      dependencies.push({ from, to, type });
    }
  };

  // Build contract map for lookup
  const contractMap = new Map<string, Contract>();
  for (const contract of callGraph.contracts) {
    contractMap.set(contract.name, contract);
  }

  // Process each contract
  for (const contract of callGraph.contracts) {
    // Add inherits dependencies
    for (const parentName of contract.inherits || []) {
      if (contractMap.has(parentName)) {
        addDependency(contract.name, parentName, 'inherits');
      }
    }

    // Add implements dependencies
    for (const ifaceName of contract.implements || []) {
      if (contractMap.has(ifaceName)) {
        addDependency(contract.name, ifaceName, 'implements');
      }
    }

    // Find library calls from function calls
    const allFunctions = [
      ...(contract.externalFunctions || []),
      ...(contract.internalFunctions || []),
    ];

    for (const func of allFunctions) {
      for (const call of func.calls || []) {
        if (call.type === 'library' && call.target?.includes('.')) {
          const [libName] = call.target.split('.');
          if (contractMap.has(libName)) {
            addDependency(contract.name, libName, 'uses');
          }
        }
      }
    }
  }

  return {
    ...callGraph,
    dependencies,
  };
}

// GET /api/libraries/[id] - Load a specific library
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: libraryId } = await params;

    // Find library info
    const libraryInfo = AVAILABLE_LIBRARIES.find(l => l.id === libraryId);
    if (!libraryInfo) {
      return NextResponse.json(
        { error: `Unknown library: ${libraryId}` },
        { status: 404 }
      );
    }

    // Get the library data
    const data = libraryDataMap[libraryId];
    if (!data) {
      return NextResponse.json(
        { error: `Library data not found: ${libraryId}` },
        { status: 404 }
      );
    }

    // Cast to expected structure
    const libraryData = data as { id: string; name: string; version: string; callGraph: CallGraph };
    let callGraph = libraryData.callGraph;

    // For sample libraries, merge with required dependency libraries
    if (SAMPLE_LIBRARIES.has(libraryId)) {
      const requiredLibs = getRequiredLibraries(callGraph.contracts);

      if (requiredLibs.size > 0) {
        const libraryCallGraphsWithIds: Array<{ callGraph: CallGraph; libraryId: string }> = [];

        for (const libId of requiredLibs) {
          const libData = libraryDataMap[libId];
          if (libData) {
            const typedLibData = libData as { callGraph: CallGraph };
            libraryCallGraphsWithIds.push({
              callGraph: typedLibData.callGraph,
              libraryId: libId,
            });
          }
        }

        if (libraryCallGraphsWithIds.length > 0) {
          callGraph = mergeWithDependencies(callGraph, libraryCallGraphsWithIds);
        }
      }
    }

    // Process local dependencies for all libraries (inheritance, implements, uses)
    if (!callGraph.dependencies || callGraph.dependencies.length === 0) {
      callGraph = processLocalDependencies(callGraph);
    }

    return NextResponse.json({
      library: {
        id: libraryData.id,
        name: libraryData.name,
        version: libraryData.version,
      },
      callGraph,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to load library' },
      { status: 500 }
    );
  }
}
