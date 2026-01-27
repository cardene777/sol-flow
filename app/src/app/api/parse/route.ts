import { NextRequest, NextResponse } from 'next/server';
import { parseSolidityFiles } from '@/lib/solidityParser';
import { buildCallGraph } from '@/lib/callGraphBuilder';
import { resolveLibraryDependencies } from '@/lib/libraryResolver';

interface FileData {
  path: string;
  content: string;
}

interface ParseRequest {
  projectName: string;
  files: FileData[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ParseRequest = await request.json();
    const { projectName, files } = body;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Debug: Log uploaded file paths
    console.log('=== Uploaded Files Debug ===');
    console.log('Total files:', files.length);
    files.slice(0, 10).forEach(f => {
      console.log('  Path:', f.path);
    });
    console.log('============================');

    // Parse Solidity files
    const uploadedContracts = parseSolidityFiles(
      files.map((f) => ({ path: f.path, content: f.content }))
    );

    if (uploadedContracts.length === 0) {
      return NextResponse.json(
        { error: 'No contracts found in uploaded files' },
        { status: 400 }
      );
    }

    // Debug: Log parsed contracts and their paths
    console.log('=== Parsed Contracts Debug ===');
    console.log('Total contracts:', uploadedContracts.length);
    uploadedContracts.slice(0, 10).forEach(c => {
      console.log(`  ${c.name}: ${c.filePath}`);
      console.log(`    - has /functions/: ${c.filePath.includes('/functions/')}`);
      console.log(`    - has /libs/: ${c.filePath.includes('/libs/')}`);
    });
    console.log('==============================');

    // Resolve external library dependencies
    const allContracts = resolveLibraryDependencies(uploadedContracts);

    // Debug: Check TeleporterMessenger source code
    const teleporter = allContracts.find(c => c.name === 'TeleporterMessenger');
    if (teleporter) {
      const sendFunc = teleporter.externalFunctions.find(f => f.name === 'sendCrossChainMessage');
      console.log('[Parse API] TeleporterMessenger found:', {
        filePath: teleporter.filePath,
        isExternalLibrary: teleporter.isExternalLibrary,
        externalFunctionCount: teleporter.externalFunctions.length,
        sendCrossChainMessageHasCode: !!sendFunc?.sourceCode,
        sourceCodeLength: sendFunc?.sourceCode?.length || 0,
      });
    } else {
      console.log('[Parse API] TeleporterMessenger NOT found in allContracts');
      console.log('[Parse API] Available contracts:', allContracts.map(c => c.name).join(', '));
    }

    // Build call graph
    const callGraph = buildCallGraph(projectName, allContracts);

    // Debug: Log ERC7546 detection results
    const erc7546Contracts = callGraph.contracts.filter(c => c.proxyPattern === 'eip7546');
    console.log('=== ERC7546 Detection Debug ===');
    console.log('Total contracts:', callGraph.contracts.length);
    console.log('ERC7546 contracts:', erc7546Contracts.length);
    erc7546Contracts.forEach(c => {
      console.log(`  - ${c.name}: ${c.proxyRole} (${c.filePath})`);
    });
    console.log('Sample file paths:');
    callGraph.contracts.slice(0, 5).forEach(c => {
      console.log(`  - ${c.name}: ${c.filePath}`);
    });
    console.log('================================');

    return NextResponse.json({ callGraph });
  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse files' },
      { status: 500 }
    );
  }
}
