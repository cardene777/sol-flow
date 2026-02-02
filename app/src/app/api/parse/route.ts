import { NextRequest, NextResponse } from 'next/server';
import { parseSolidityFiles } from '@/lib/solidityParser';
import { buildCallGraph } from '@/lib/callGraphBuilder';
import { resolveLibraryDependencies } from '@/lib/libraryResolver';

// Security limits
const MAX_REQUEST_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES = 500;
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB per file

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
    // Check request size
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
      return NextResponse.json(
        { error: 'Request too large' },
        { status: 413 }
      );
    }

    const body: ParseRequest = await request.json();
    const { projectName, files } = body;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validate file count
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Too many files. Maximum ${MAX_FILES} files allowed` },
        { status: 400 }
      );
    }

    // Validate individual file sizes
    for (const file of files) {
      if (file.content.length > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File too large: ${file.path}` },
          { status: 400 }
        );
      }
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

    // Resolve external library dependencies (uses pre-parsed library data)
    const allContracts = await resolveLibraryDependencies(uploadedContracts);

    // Build call graph
    const callGraph = buildCallGraph(projectName, allContracts);

    return NextResponse.json({ callGraph });
  } catch (error) {
    // Log error server-side for debugging
    console.error('Parse error:', error);
    // Return generic message to client to avoid information leakage
    return NextResponse.json(
      { error: 'Failed to parse files' },
      { status: 500 }
    );
  }
}
