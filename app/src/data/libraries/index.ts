import type { CallGraph } from '@/types/callGraph';

export interface LibraryCacheData {
  id: string;
  name: string;
  version: string;
  generatedAt: string;
  callGraph: CallGraph;
}

export interface LibraryInfo {
  id: string;
  name: string;
  version: string;
  fileName: string;
}

// Available pre-parsed libraries
export const AVAILABLE_LIBRARIES: LibraryInfo[] = [
  // Standalone libraries
  {
    id: 'openzeppelin',
    name: 'OpenZeppelin Contracts',
    version: '5.0.0',
    fileName: 'openzeppelin-parsed.json',
  },
  {
    id: 'openzeppelin-upgradeable',
    name: 'OpenZeppelin Upgradeable',
    version: '5.0.0',
    fileName: 'openzeppelin-upgradeable-parsed.json',
  },
  {
    id: 'solady',
    name: 'Solady',
    version: 'latest',
    fileName: 'solady-parsed.json',
  },
  // Avalanche ICM libraries
  {
    id: 'avalanche-teleporter',
    name: 'Avalanche Teleporter',
    version: '1.0.0',
    fileName: 'avalanche-teleporter-parsed.json',
  },
  {
    id: 'avalanche-ictt',
    name: 'Avalanche ICTT',
    version: '1.0.0',
    fileName: 'avalanche-ictt-parsed.json',
  },
  {
    id: 'avalanche-validator-manager',
    name: 'Avalanche Validator Manager',
    version: '1.0.0',
    fileName: 'avalanche-validator-manager-parsed.json',
  },
  {
    id: 'avalanche-utilities',
    name: 'Avalanche Utilities',
    version: '1.0.0',
    fileName: 'avalanche-utilities-parsed.json',
  },
  // Proxy pattern samples
  {
    id: 'sample-uups',
    name: 'UUPS Proxy Sample',
    version: '1.0.0',
    fileName: 'sample-uups-parsed.json',
  },
  {
    id: 'sample-transparent',
    name: 'Transparent Proxy Sample',
    version: '1.0.0',
    fileName: 'sample-transparent-parsed.json',
  },
  {
    id: 'sample-diamond',
    name: 'Diamond Proxy Sample',
    version: '1.0.0',
    fileName: 'sample-diamond-parsed.json',
  },
  {
    id: 'sample-beacon',
    name: 'Beacon Proxy Sample',
    version: '1.0.0',
    fileName: 'sample-beacon-parsed.json',
  },
  {
    id: 'sample-erc7546',
    name: 'ERC-7546 Modular Proxy Sample',
    version: '1.0.0',
    fileName: 'sample-erc7546-parsed.json',
  },
];

// Cache for loaded libraries
const libraryCache = new Map<string, LibraryCacheData>();

// Load a pre-parsed library
export async function loadLibrary(libraryId: string): Promise<LibraryCacheData | null> {
  // Check cache first
  if (libraryCache.has(libraryId)) {
    return libraryCache.get(libraryId)!;
  }

  const info = AVAILABLE_LIBRARIES.find(l => l.id === libraryId);
  if (!info) {
    return null;
  }

  try {
    // Dynamic import of the JSON file
    const data = await import(`./${info.fileName}`);
    const cacheData = data.default || data;
    libraryCache.set(libraryId, cacheData);
    return cacheData;
  } catch {
    return null;
  }
}

// Load the default library (OpenZeppelin)
export async function loadDefaultLibrary(): Promise<CallGraph | null> {
  const data = await loadLibrary('openzeppelin');
  return data?.callGraph || null;
}

// Get contract names that a user's contracts might inherit from
export function getInheritableContracts(libraryId: string): string[] {
  const data = libraryCache.get(libraryId);
  if (!data) return [];

  return data.callGraph.contracts
    .filter(c => c.kind === 'contract' || c.kind === 'abstract')
    .map(c => c.name);
}
