import { NextResponse } from 'next/server';
import type { Contract, ContractCategory, CallGraph } from '@/types/callGraph';
import openzeppelinData from '@/data/libraries/openzeppelin-parsed.json';

// Recategorize contract based on file path
function recategorizeContract(contract: Contract): ContractCategory {
  if (contract.kind === 'interface') return 'interface';
  if (contract.kind === 'library') return 'library';

  const path = contract.filePath.toLowerCase();
  const name = contract.name.toLowerCase();

  if (path.includes('/access/')) return 'access';
  if (path.includes('/account/')) return 'account';
  if (path.includes('/finance/')) return 'finance';
  if (path.includes('/governance/')) return 'governance';
  if (path.includes('/metatx/')) return 'metatx';
  if (path.includes('/proxy/')) return 'proxy';
  if (path.includes('/token/')) return 'token';
  if (path.includes('/utils/')) return 'utils';

  if (name.includes('erc20') || name.includes('erc721') || name.includes('erc1155')) return 'token';
  if (name.includes('ownable') || name.includes('access') || name.includes('role')) return 'access';
  if (name.includes('proxy') || name.includes('upgradeable')) return 'proxy';
  if (name.includes('governor') || name.includes('timelock') || name.includes('votes')) return 'governance';
  if (name.includes('pausable') || name.includes('reentrancy') || name.includes('context')) return 'utils';

  return 'other';
}

function recategorizeCallGraph(callGraph: CallGraph): CallGraph {
  return {
    ...callGraph,
    contracts: callGraph.contracts.map(contract => ({
      ...contract,
      category: recategorizeContract(contract as Contract),
    })),
  } as CallGraph;
}

// GET /api/libraries/default - Load default OpenZeppelin library (for backwards compatibility)
export async function GET() {
  try {
    const recategorizedCallGraph = recategorizeCallGraph(openzeppelinData.callGraph as unknown as CallGraph);

    return NextResponse.json({
      library: {
        id: openzeppelinData.id,
        name: openzeppelinData.name,
        version: openzeppelinData.version,
      },
      callGraph: recategorizedCallGraph,
    });
  } catch (error) {
    console.error('Error loading default library:', error);
    return NextResponse.json(
      { error: 'Failed to load default library' },
      { status: 500 }
    );
  }
}
