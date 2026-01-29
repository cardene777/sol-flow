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

    // Resolve external library dependencies
    const allContracts = resolveLibraryDependencies(uploadedContracts);

    // Build call graph
    const callGraph = buildCallGraph(projectName, allContracts);

    return NextResponse.json({ callGraph });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse files' },
      { status: 500 }
    );
  }
}
