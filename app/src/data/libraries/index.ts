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
    console.error(`Unknown library: ${libraryId}`);
    return null;
  }

  try {
    // Dynamic import of the JSON file
    const data = await import(`./${info.fileName}`);
    const cacheData = data.default || data;
    libraryCache.set(libraryId, cacheData);
    return cacheData;
  } catch (error) {
    console.error(`Failed to load library ${libraryId}:`, error);
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
