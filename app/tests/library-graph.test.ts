import { describe, expect, it } from 'vitest';
import type { CallGraph } from '@/types/callGraph';

type LibraryGraphModule = {
  buildLibraryGraph: (id: string) => {
    library: { id: string; name: string; version: string };
    callGraph: CallGraph;
  } | null;
};

// build の時にライブラリの .json を作る関数を読み込む。無ければ null を返す。
async function loadLibraryGraph(): Promise<LibraryGraphModule | null> {
  const path = '@/lib/libraryGraph';
  try {
    return (await import(/* @vite-ignore */ path)) as LibraryGraphModule;
  } catch {
    return null;
  }
}

describe('library graph', () => {
  it('sample-library-merges-dependencies', async () => {
    const mod = await loadLibraryGraph();
    expect(mod, 'src/lib/libraryGraph.ts が buildLibraryGraph を持つ').not.toBeNull();

    const result = mod!.buildLibraryGraph('sample-uups');
    expect(result).not.toBeNull();
    const names = result!.callGraph.contracts.map((c) => c.name);
    // sample-uups 自身の契約は CounterV1 / CounterV2 / UUPSProxy の 3 つ。
    expect(names).toEqual(expect.arrayContaining(['CounterV1', 'CounterV2', 'UUPSProxy']));
    // import している OpenZeppelin Upgradeable の契約も含む。
    expect(names).toEqual(expect.arrayContaining(['UUPSUpgradeable', 'OwnableUpgradeable']));
  });
});
