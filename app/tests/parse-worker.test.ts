import { describe, expect, it } from 'vitest';
import { parseSolidityFiles } from '@/lib/solidityParser';
import { resolveLibraryDependencies } from '@/lib/libraryResolver';
import { buildCallGraph } from '@/lib/callGraphBuilder';
import type { CallGraph } from '@/types/callGraph';
import { noContractFiles, openzeppelinOnlyFiles } from './fixtures/sources';

type ParseReply = { ok: true; callGraph: CallGraph } | { ok: false; error: string };
type ParseHandlerModule = {
  handleParseRequest: (request: {
    projectName: string;
    files: { path: string; content: string }[];
  }) => Promise<ParseReply>;
};

// Web Worker が受け取ったメッセージを処理する関数を読み込む。無ければ null を返す。
async function loadHandler(): Promise<ParseHandlerModule | null> {
  const path = '@/workers/parseHandler';
  try {
    return (await import(/* @vite-ignore */ path)) as ParseHandlerModule;
  } catch {
    return null;
  }
}

function withoutTime(callGraph: CallGraph) {
  const { generatedAt: _generatedAt, ...rest } = callGraph;
  return rest;
}

describe('parse worker', () => {
  it('worker-returns-call-graph', async () => {
    const handler = await loadHandler();
    expect(handler, 'src/workers/parseHandler.ts が handleParseRequest を持つ').not.toBeNull();

    const reply = await handler!.handleParseRequest({
      projectName: 'Fixture',
      files: openzeppelinOnlyFiles,
    });
    expect(reply.ok).toBe(true);

    const expected = buildCallGraph(
      'Fixture',
      await resolveLibraryDependencies(parseSolidityFiles(openzeppelinOnlyFiles)),
    );
    expect(withoutTime((reply as { callGraph: CallGraph }).callGraph)).toEqual(
      withoutTime(expected),
    );
  });

  it('worker-refuses-no-contracts', async () => {
    const handler = await loadHandler();
    expect(handler, 'src/workers/parseHandler.ts が handleParseRequest を持つ').not.toBeNull();

    const reply = await handler!.handleParseRequest({
      projectName: 'Empty',
      files: noContractFiles,
    });
    expect(reply).toEqual({ ok: false, error: 'No contracts found in uploaded files' });
  });
});
