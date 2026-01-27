import { NextRequest, NextResponse } from 'next/server';
import type { Contract, ContractCategory, CallGraph } from '@/types/callGraph';
import { AVAILABLE_LIBRARIES } from '@/data/libraries';

// Import all library data statically (Next.js requires static imports for bundling)
import openzeppelinData from '@/data/libraries/openzeppelin-parsed.json';
import openzeppelinUpgradeableData from '@/data/libraries/openzeppelin-upgradeable-parsed.json';
import soladyData from '@/data/libraries/solady-parsed.json';
import sampleUupsData from '@/data/libraries/sample-uups-parsed.json';
import sampleTransparentData from '@/data/libraries/sample-transparent-parsed.json';
import sampleDiamondData from '@/data/libraries/sample-diamond-parsed.json';
import sampleBeaconData from '@/data/libraries/sample-beacon-parsed.json';
// Avalanche ICM libraries
import avalancheTeleporterData from '@/data/libraries/avalanche-teleporter-parsed.json';
import avalancheIcttData from '@/data/libraries/avalanche-ictt-parsed.json';
import avalancheValidatorManagerData from '@/data/libraries/avalanche-validator-manager-parsed.json';
import avalancheUtilitiesData from '@/data/libraries/avalanche-utilities-parsed.json';

// Map of library IDs to their data
const libraryDataMap: Record<string, unknown> = {
  'openzeppelin': openzeppelinData,
  'openzeppelin-upgradeable': openzeppelinUpgradeableData,
  'solady': soladyData,
  'sample-uups': sampleUupsData,
  'sample-transparent': sampleTransparentData,
  'sample-diamond': sampleDiamondData,
  'sample-beacon': sampleBeaconData,
  // Avalanche ICM
  'avalanche-teleporter': avalancheTeleporterData,
  'avalanche-ictt': avalancheIcttData,
  'avalanche-validator-manager': avalancheValidatorManagerData,
  'avalanche-utilities': avalancheUtilitiesData,
};

// No need to recategorize - categories are now determined dynamically during parsing
// based on directory structure. The callGraph already has correct categories.

// GET /api/libraries/[id] - Load a specific library
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: libraryId } = await params;

    // Find library info
    const libraryInfo = AVAILABLE_LIBRARIES.find(l => l.id === libraryId);
    if (!libraryInfo) {
      return NextResponse.json(
        { error: `Unknown library: ${libraryId}` },
        { status: 404 }
      );
    }

    // Get the library data
    const data = libraryDataMap[libraryId];
    if (!data) {
      return NextResponse.json(
        { error: `Library data not found: ${libraryId}` },
        { status: 404 }
      );
    }

    // Cast to expected structure
    const libraryData = data as { id: string; name: string; version: string; callGraph: CallGraph };

    // Categories are now determined dynamically during parsing based on directory structure
    return NextResponse.json({
      library: {
        id: libraryData.id,
        name: libraryData.name,
        version: libraryData.version,
      },
      callGraph: libraryData.callGraph,
    });
  } catch (error) {
    console.error('Error loading library:', error);
    return NextResponse.json(
      { error: 'Failed to load library' },
      { status: 500 }
    );
  }
}
