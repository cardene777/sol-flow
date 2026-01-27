import { NextRequest, NextResponse } from 'next/server';
import type { Contract, ContractCategory, CallGraph } from '@/types/callGraph';
import { AVAILABLE_LIBRARIES } from '@/data/libraries';

// Import all library data statically (Next.js requires static imports for bundling)
import openzeppelinData from '@/data/libraries/openzeppelin-parsed.json';
import openzeppelinUpgradeableData from '@/data/libraries/openzeppelin-upgradeable-parsed.json';
import soladyData from '@/data/libraries/solady-parsed.json';

// Map of library IDs to their data
const libraryDataMap: Record<string, unknown> = {
  'openzeppelin': openzeppelinData,
  'openzeppelin-upgradeable': openzeppelinUpgradeableData,
  'solady': soladyData,
};

// Recategorize contract based on file path (OpenZeppelin directory structure)
function recategorizeContract(contract: Contract): ContractCategory {
  if (contract.kind === 'interface') return 'interface';
  if (contract.kind === 'library') return 'library';

  const path = contract.filePath.toLowerCase();
  const name = contract.name.toLowerCase();

  // Detect from file path (OpenZeppelin directory structure)
  if (path.includes('/access/')) return 'access';
  if (path.includes('/account/')) return 'account';
  if (path.includes('/finance/')) return 'finance';
  if (path.includes('/governance/')) return 'governance';
  if (path.includes('/metatx/')) return 'metatx';
  if (path.includes('/proxy/')) return 'proxy';
  if (path.includes('/token/')) return 'token';
  if (path.includes('/utils/')) return 'utils';

  // Solady specific paths
  if (path.includes('/auth/')) return 'access';
  if (path.includes('/tokens/')) return 'token';

  // Fallback to name-based detection
  if (name.includes('erc20') || name.includes('erc721') || name.includes('erc1155')) return 'token';
  if (name.includes('ownable') || name.includes('access') || name.includes('role')) return 'access';
  if (name.includes('proxy') || name.includes('upgradeable')) return 'proxy';
  if (name.includes('governor') || name.includes('timelock') || name.includes('votes')) return 'governance';
  if (name.includes('pausable') || name.includes('reentrancy') || name.includes('context')) return 'utils';

  return 'other';
}

// Recategorize all contracts in a call graph
function recategorizeCallGraph(callGraph: CallGraph): CallGraph {
  return {
    ...callGraph,
    contracts: callGraph.contracts.map(contract => ({
      ...contract,
      category: recategorizeContract(contract as Contract),
    })),
  } as CallGraph;
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

    // Recategorize contracts based on file paths
    const recategorizedCallGraph = recategorizeCallGraph(libraryData.callGraph);

    return NextResponse.json({
      library: {
        id: libraryData.id,
        name: libraryData.name,
        version: libraryData.version,
      },
      callGraph: recategorizedCallGraph,
    });
  } catch (error) {
    console.error('Error loading library:', error);
    return NextResponse.json(
      { error: 'Failed to load library' },
      { status: 500 }
    );
  }
}
