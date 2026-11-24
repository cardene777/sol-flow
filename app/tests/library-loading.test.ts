import { describe, expect, it, vi } from 'vitest';
import { parseSolidityFiles } from '@/lib/solidityParser';
import { resolveLibraryDependencies } from '@/lib/libraryResolver';
import { openzeppelinOnlyFiles } from './fixtures/sources';

// ライブラリの JSON が読み込まれた順に、その id を記録する。
const loaded = vi.hoisted(() => [] as string[]);

vi.mock('@/data/libraries/openzeppelin-parsed.json', async (importOriginal) => {
  loaded.push('openzeppelin');
  return importOriginal();
});
vi.mock('@/data/libraries/openzeppelin-upgradeable-parsed.json', async (importOriginal) => {
  loaded.push('openzeppelin-upgradeable');
  return importOriginal();
});
vi.mock('@/data/libraries/solady-parsed.json', async (importOriginal) => {
  loaded.push('solady');
  return importOriginal();
});

describe('library loading', () => {
  it('loads-only-imported-libraries', async () => {
    const uploaded = parseSolidityFiles(openzeppelinOnlyFiles);
    await resolveLibraryDependencies(uploaded);
    expect(loaded).toContain('openzeppelin');
    expect(loaded, 'Solady と Upgradeable の JSON は import に無いので読まない').toEqual([
      'openzeppelin',
    ]);
  });
});
