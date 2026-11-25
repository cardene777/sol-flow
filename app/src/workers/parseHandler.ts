import type { CallGraph } from '@/types/callGraph';
import { parseSolidityFiles } from '@/lib/solidityParser';
import { resolveLibraryDependencies } from '@/lib/libraryResolver';
import { buildCallGraph } from '@/lib/callGraphBuilder';

// ブラウザのメモリを使い切らないよう、1回に解析するfileの数と大きさに上限を置く
const MAX_FILES = 500;
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 file あたり 1MB

export interface ParseRequest {
  projectName: string;
  files: { path: string; content: string }[];
}

export type ParseReply = { ok: true; callGraph: CallGraph } | { ok: false; error: string };

/**
 * 解析の Web Worker が受け取ったメッセージを処理する。
 * アップロードした .sol を解析し、import しているライブラリの契約を合わせた呼び出し図を返す。
 */
export async function handleParseRequest({ projectName, files }: ParseRequest): Promise<ParseReply> {
  if (!files || files.length === 0) {
    return { ok: false, error: 'No files provided' };
  }
  if (files.length > MAX_FILES) {
    return { ok: false, error: `Too many files. Maximum ${MAX_FILES} files allowed` };
  }
  const tooLarge = files.find((file) => file.content.length > MAX_FILE_SIZE);
  if (tooLarge) {
    return { ok: false, error: `File too large: ${tooLarge.path}` };
  }

  try {
    const uploadedContracts = parseSolidityFiles(files);
    if (uploadedContracts.length === 0) {
      return { ok: false, error: 'No contracts found in uploaded files' };
    }
    const allContracts = await resolveLibraryDependencies(uploadedContracts);
    return { ok: true, callGraph: buildCallGraph(projectName, allContracts) };
  } catch {
    return { ok: false, error: 'Failed to parse files' };
  }
}
