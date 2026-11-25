import { describe, expect, it } from 'vitest';
import { parseSolidityFiles } from '@/lib/solidityParser';
import { resolveLibraryDependencies } from '@/lib/libraryResolver';
import { buildCallGraph } from '@/lib/callGraphBuilder';
import { openzeppelinOnlyFiles } from './fixtures/sources';

describe('parse pipeline', () => {
  // 組み替えの前に書き出した呼び出し図と、同じ契約と関数と依存を持つ。
  // generatedAt は実行の時刻なので比べない。
  it('parse-output-unchanged', async () => {
    const uploaded = parseSolidityFiles(openzeppelinOnlyFiles);
    const all = await resolveLibraryDependencies(uploaded);
    const { generatedAt: _generatedAt, ...callGraph } = buildCallGraph('Fixture', all);
    await expect(JSON.stringify(callGraph, null, 2)).toMatchFileSnapshot(
      './__snapshots__/parse-output.json',
    );
  });
});
