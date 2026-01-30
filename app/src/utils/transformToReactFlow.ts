import type { Node, Edge } from 'reactflow';
import { MarkerType } from 'reactflow';
import dagre from 'dagre';
import type { CallGraph, Contract, Dependency, ContractCategory, ProxyGroup, ProxyPatternType } from '@/types/callGraph';

export type LayoutMode = 'grid' | 'hierarchy';

export interface ContractNodeData {
  contract: Contract;
  isSelected: boolean;
  selectedFunction: string | null;
  nodeHeight: number;  // Dynamic height based on function count
}

export interface LibraryNodeData {
  contract: Contract;
  isSelected: boolean;
}

export interface ProxyGroupNodeData {
  group: ProxyGroup;
  label: string;
}

export interface ProxyPatternGroupNodeData {
  patternType: ProxyPatternType;
  label: string;
  contractCount: number;
}

export interface CategoryGroupNodeData {
  category: ContractCategory;
  subCategory?: string;
  label: string;
  contractCount: number;
}

interface NodePosition {
  x: number;
  y: number;
}

interface CategoryBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  category: ContractCategory;
  groupId?: string;  // Group ID for sub-categories (e.g., "token-erc20")
}

// Layout constants
const NODE_WIDTH = 380;
const NODE_MIN_HEIGHT = 160;  // Minimum height for contracts with few/no functions
const NODE_MAX_HEIGHT = 3000;  // Maximum height for very large contracts (effectively no limit)
const NODE_GAP_X = 60;  // Horizontal gap between cards
const NODE_GAP_Y = 60;  // Vertical gap between rows
const CATEGORY_PADDING = 60;  // Padding inside category groups

/**
 * Calculate the height of a contract node based on its functions
 * Used for layout calculations - should be >= actual rendered height
 *
 * IMPORTANT: This must ALWAYS return a value >= actual rendered height
 * to prevent cards from overflowing category boundaries.
 * We use very generous multipliers to ensure this.
 */
export function calculateNodeHeight(contract: Contract): number {
  const totalExternalFunctions = contract.externalFunctions.length;
  const hasInternalFunctions = contract.internalFunctions.length > 0;
  const hasProxyIndicator = !!contract.proxyPattern;
  const hasLibraryIndicator = !!contract.isExternalLibrary;
  const hasNoFunctions = totalExternalFunctions === 0 && !hasInternalFunctions;

  // Split external functions into view/pure and state-changing
  const viewFunctions = contract.externalFunctions.filter(
    f => f.stateMutability === 'view' || f.stateMutability === 'pure'
  );
  const writeFunctions = contract.externalFunctions.filter(
    f => f.stateMutability !== 'view' && f.stateMutability !== 'pure'
  );

  // Base height: header (~60px) + footer (~40px) + content padding (20px)
  let height = 120;

  // External library indicator adds a row at the top
  if (hasLibraryIndicator) {
    height += 30;
  }

  // Proxy indicator adds a row at the top
  if (hasProxyIndicator) {
    height += 40;
  }

  // External/Public section
  if (totalExternalFunctions > 0) {
    // Section header "External / Public"
    height += 40;

    // view/pure sub-section (if has view functions)
    if (viewFunctions.length > 0) {
      height += 28;  // sub-header "view / pure"
      height += viewFunctions.length * 48;  // Each function item (generous)
    }

    // state-changing sub-section (if has write functions)
    if (writeFunctions.length > 0) {
      height += 28;  // sub-header "state-changing"
      height += writeFunctions.length * 48;  // Each function item (generous)
    }
  }

  // Internal/Private section (collapsed toggle button)
  if (hasInternalFunctions) {
    height += 60;
  }

  // Empty state message
  if (hasNoFunctions) {
    height += 80;
  }

  // Add generous buffer for spacing, margins, borders, shadows, and font rendering variations
  height += 50;

  return Math.max(NODE_MIN_HEIGHT, Math.min(NODE_MAX_HEIGHT, height));
}

// Well-known categories that should appear first (in order)
const WELL_KNOWN_CATEGORIES = [
  'token', 'access', 'governance', 'proxy', 'finance', 'account', 'metatx', 'utils',
];

// Categories that should always appear last
const LAST_CATEGORIES = ['interface', 'library', 'other'];

/**
 * Get sorted category order from contracts.
 * Well-known categories appear first, then alphabetically sorted unknown ones,
 * then interface/library/other at the end.
 */
function getCategoryOrder(contracts: Contract[]): ContractCategory[] {
  const categories = new Set<ContractCategory>();
  for (const c of contracts) {
    categories.add(c.category);
  }

  const result: ContractCategory[] = [];
  const unknown: ContractCategory[] = [];

  // Add well-known categories first (in order)
  for (const cat of WELL_KNOWN_CATEGORIES) {
    if (categories.has(cat)) {
      result.push(cat);
      categories.delete(cat);
    }
  }

  // Separate last categories
  for (const cat of LAST_CATEGORIES) {
    categories.delete(cat);
  }

  // Sort remaining unknown categories alphabetically
  for (const cat of categories) {
    unknown.push(cat);
  }
  unknown.sort((a, b) => a.localeCompare(b));
  result.push(...unknown);

  // Add last categories at the end
  for (const cat of LAST_CATEGORIES) {
    if (contracts.some(c => c.category === cat)) {
      result.push(cat);
    }
  }

  return result;
}

/**
 * Get display label for a category.
 * Capitalizes first letter and replaces hyphens/underscores with spaces.
 */
function getCategoryLabel(category: ContractCategory): string {
  // Special cases
  const specialLabels: Record<string, string> = {
    'access': 'Access Control',
    'metatx': 'Meta TX',
    'utils': 'Utilities',
  };

  if (specialLabels[category.toLowerCase()]) {
    return specialLabels[category.toLowerCase()];
  }

  // Default: capitalize and replace hyphens/underscores
  return category
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Sub-category threshold - split category if more than this many contracts
const SUB_CATEGORY_THRESHOLD = 10;

// Sub-category definitions for large categories
type SubCategoryKey = string;

interface SubCategoryDef {
  label: string;
  match: (contract: Contract) => boolean;
}

const SUB_CATEGORIES: Partial<Record<ContractCategory, Record<SubCategoryKey, SubCategoryDef>>> = {
  token: {
    'erc20': {
      label: 'ERC20',
      match: (c) => c.name.toLowerCase().includes('erc20') || c.filePath.toLowerCase().includes('/erc20/'),
    },
    'erc721': {
      label: 'ERC721',
      match: (c) => c.name.toLowerCase().includes('erc721') || c.filePath.toLowerCase().includes('/erc721/'),
    },
    'erc1155': {
      label: 'ERC1155',
      match: (c) => c.name.toLowerCase().includes('erc1155') || c.filePath.toLowerCase().includes('/erc1155/'),
    },
    'erc6909': {
      label: 'ERC6909',
      match: (c) => c.name.toLowerCase().includes('erc6909') || c.filePath.toLowerCase().includes('/erc6909/'),
    },
    'other': {
      label: 'Other Tokens',
      match: () => true,  // Fallback
    },
  },
  access: {
    'ownable': {
      label: 'Ownable',
      match: (c) => c.name.toLowerCase().includes('ownable'),
    },
    'accesscontrol': {
      label: 'AccessControl',
      match: (c) => c.name.toLowerCase().includes('accesscontrol') || c.name.toLowerCase().includes('role'),
    },
    'manager': {
      label: 'Manager',
      match: (c) => c.name.toLowerCase().includes('manager'),
    },
    'other': {
      label: 'Other Access',
      match: () => true,
    },
  },
  governance: {
    'governor': {
      label: 'Governor',
      match: (c) => c.name.toLowerCase().includes('governor'),
    },
    'timelock': {
      label: 'Timelock',
      match: (c) => c.name.toLowerCase().includes('timelock'),
    },
    'votes': {
      label: 'Votes',
      match: (c) => c.name.toLowerCase().includes('votes') || c.name.toLowerCase().includes('voting'),
    },
    'other': {
      label: 'Other Governance',
      match: () => true,
    },
  },
  utils: {
    'cryptography': {
      label: 'Cryptography',
      match: (c) => c.filePath.toLowerCase().includes('/cryptography/') ||
        ['ecdsa', 'merkle', 'signature', 'hash', 'eip712'].some(k => c.name.toLowerCase().includes(k)),
    },
    'introspection': {
      label: 'Introspection',
      match: (c) => c.filePath.toLowerCase().includes('/introspection/') || c.name.toLowerCase().includes('erc165'),
    },
    'structs': {
      label: 'Data Structures',
      match: (c) => c.filePath.toLowerCase().includes('/structs/') ||
        ['bitmap', 'enumerable', 'set', 'map', 'queue', 'heap'].some(k => c.name.toLowerCase().includes(k)),
    },
    'other': {
      label: 'Other Utils',
      match: () => true,
    },
  },
  proxy: {
    'transparent': {
      label: 'Transparent',
      match: (c) => c.name.toLowerCase().includes('transparent'),
    },
    'uups': {
      label: 'UUPS',
      match: (c) => c.name.toLowerCase().includes('uups'),
    },
    'beacon': {
      label: 'Beacon',
      match: (c) => c.name.toLowerCase().includes('beacon'),
    },
    'other': {
      label: 'Other Proxy',
      match: () => true,
    },
  },
  library: {
    'math': {
      label: 'Math',
      match: (c) => ['math', 'safecast', 'signedmath', 'fixedpoint', 'mulwad', 'fullmath', 'wadray'].some(k => c.name.toLowerCase().includes(k)),
    },
    'strings': {
      label: 'Strings',
      match: (c) => ['string', 'libstring'].some(k => c.name.toLowerCase().includes(k)),
    },
    'bytes': {
      label: 'Bytes',
      match: (c) => c.name.toLowerCase().includes('bytes'),
    },
    'address': {
      label: 'Address',
      match: (c) => c.name.toLowerCase().includes('address'),
    },
    'arrays': {
      label: 'Arrays/Collections',
      match: (c) => ['array', 'sort', 'slice', 'map', 'set', 'heap', 'tree', 'queue', 'buffer'].some(k => c.name.toLowerCase().includes(k)),
    },
    'storage': {
      label: 'Storage',
      match: (c) => ['storage', 'slot', 'transient', 'sstore'].some(k => c.name.toLowerCase().includes(k)),
    },
    'crypto': {
      label: 'Crypto',
      match: (c) => ['ecdsa', 'merkle', 'signature', 'p256', 'schnorr', 'hash', 'bls', 'webauthn'].some(k => c.name.toLowerCase().includes(k)),
    },
    'encoding': {
      label: 'Encoding',
      match: (c) => ['base58', 'base64', 'rlp', 'zip', 'json', 'cwia'].some(k => c.name.toLowerCase().includes(k)),
    },
    'clone': {
      label: 'Clone/Create',
      match: (c) => ['clone', 'create3', 'factory'].some(k => c.name.toLowerCase().includes(k)),
    },
    'bits': {
      label: 'Bits/Bitmap',
      match: (c) => ['bit', 'bitmap'].some(k => c.name.toLowerCase().includes(k)),
    },
    'erc': {
      label: 'ERC Standards',
      match: (c) => c.name.toLowerCase().startsWith('erc') || c.name.toLowerCase().includes('safetransfer') || c.name.toLowerCase().startsWith('lib'),
    },
    'other': {
      label: 'Other Libraries',
      match: () => true,
    },
  },
};

/**
 * Determine sub-category for a contract
 */
function getSubCategory(contract: Contract): SubCategoryKey {
  const subCats = SUB_CATEGORIES[contract.category];
  if (!subCats) return 'default';

  for (const [key, def] of Object.entries(subCats)) {
    if (key !== 'other' && def.match(contract)) {
      return key;
    }
  }
  return 'other';
}

/**
 * Get sub-category label
 */
function getSubCategoryLabel(category: ContractCategory, subCategory: SubCategoryKey): string {
  const subCats = SUB_CATEGORIES[category];
  if (subCats && subCats[subCategory]) {
    return subCats[subCategory].label;
  }
  return getCategoryLabel(category);
}

export interface TransformOptions {
  enableCategoryGroups?: boolean;
  visibleCategories?: ContractCategory[];
  layoutMode?: LayoutMode;  // 'grid' (default) or 'dagre'
  measuredHeights?: Map<string, number>;  // Actual DOM-measured heights from first render
  showLibraryContracts?: boolean;  // Show/hide external library contracts (default: false)
}

/**
 * Analyze inheritance patterns for each contract
 * Returns which categories inherit from each contract
 */
function analyzeInheritance(
  contracts: Contract[],
  dependencies: Dependency[]
): Map<string, { sameCategory: number; otherCategories: Set<ContractCategory> }> {
  const result = new Map<string, { sameCategory: number; otherCategories: Set<ContractCategory> }>();
  const contractMap = new Map<string, Contract>();

  for (const contract of contracts) {
    contractMap.set(contract.name, contract);
    result.set(contract.name, { sameCategory: 0, otherCategories: new Set() });
  }

  for (const dep of dependencies) {
    if (dep.type === 'inherits' || dep.type === 'implements') {
      const fromContract = contractMap.get(dep.from);
      const toContract = contractMap.get(dep.to);

      if (fromContract && toContract) {
        const entry = result.get(dep.to)!;
        if (fromContract.category === toContract.category) {
          entry.sameCategory++;
        } else {
          entry.otherCategories.add(fromContract.category);
        }
      }
    }
  }

  return result;
}

/**
 * Determine if a contract should be a "base contract" (outside categories)
 * Only if inherited EXCLUSIVELY by other categories (not by same category)
 */
function isBaseContract(
  contractName: string,
  inheritanceInfo: Map<string, { sameCategory: number; otherCategories: Set<ContractCategory> }>
): boolean {
  const info = inheritanceInfo.get(contractName);
  if (!info) return false;

  // Base contract = inherited by other categories but NOT by same category
  return info.sameCategory === 0 && info.otherCategories.size >= 2;
}

/**
 * Group contracts by category
 */
function groupByCategory(contracts: Contract[]): Map<ContractCategory, Contract[]> {
  const result = new Map<ContractCategory, Contract[]>();

  for (const contract of contracts) {
    if (!result.has(contract.category)) {
      result.set(contract.category, []);
    }
    result.get(contract.category)!.push(contract);
  }

  // Sort contracts within each category alphabetically
  for (const contracts of result.values()) {
    contracts.sort((a, b) => a.name.localeCompare(b.name));
  }

  return result;
}

/**
 * Group info for rendering - can be a category or sub-category
 */
interface GroupInfo {
  id: string;  // unique identifier for this group
  category: ContractCategory;
  subCategory?: SubCategoryKey;
  label: string;
  contracts: Contract[];
}

/**
 * Group contracts by category, splitting into sub-categories if too many contracts
 */
function groupContractsWithSubCategories(contracts: Contract[]): GroupInfo[] {
  const byCategory = groupByCategory(contracts);
  const groups: GroupInfo[] = [];
  const categoryOrder = getCategoryOrder(contracts);

  for (const category of categoryOrder) {
    const catContracts = byCategory.get(category);
    if (!catContracts || catContracts.length === 0) continue;

    // If category has more than threshold contracts and has sub-categories defined
    if (catContracts.length > SUB_CATEGORY_THRESHOLD && SUB_CATEGORIES[category]) {
      // Group by sub-category
      const bySubCat = new Map<SubCategoryKey, Contract[]>();

      for (const contract of catContracts) {
        const subCat = getSubCategory(contract);
        if (!bySubCat.has(subCat)) {
          bySubCat.set(subCat, []);
        }
        bySubCat.get(subCat)!.push(contract);
      }

      // Create groups for each sub-category with contracts
      const subCatDefs = SUB_CATEGORIES[category]!;
      for (const [subCatKey, def] of Object.entries(subCatDefs)) {
        const subCatContracts = bySubCat.get(subCatKey);
        if (subCatContracts && subCatContracts.length > 0) {
          groups.push({
            id: `${category}-${subCatKey}`,
            category,
            subCategory: subCatKey,
            label: def.label,
            contracts: subCatContracts.sort((a, b) => a.name.localeCompare(b.name)),
          });
        }
      }
    } else {
      // Keep as single category group
      groups.push({
        id: category,
        category,
        label: getCategoryLabel(category),
        contracts: catContracts,
      });
    }
  }

  return groups;
}

/**
 * Calculate hierarchical positions for contracts within a group using dagre
 * Returns relative positions within the group
 * If no hierarchy exists (no edges), returns empty map to signal grid fallback
 */
function calculateHierarchicalPositions(
  contracts: Contract[],
  dependencies: Dependency[],
  nodeHeights?: Map<string, number>
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  if (contracts.length === 0) return positions;
  if (contracts.length === 1) {
    positions.set(contracts[0].name, { x: 0, y: 0 });
    return positions;
  }

  const contractNames = new Set(contracts.map(c => c.name));

  // Count edges within this group first
  let edgeCount = 0;
  for (const dep of dependencies) {
    if (dep.type !== 'inherits' && dep.type !== 'implements') continue;
    if (!contractNames.has(dep.from) || !contractNames.has(dep.to)) continue;
    edgeCount++;
  }

  // If no edges within this group, return empty to signal grid fallback
  // This prevents dagre from placing all nodes in a single horizontal row
  if (edgeCount === 0) {
    return positions;
  }

  // Create dagre graph for this group
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: 'TB',
    nodesep: NODE_GAP_X,
    ranksep: NODE_GAP_Y,
    marginx: 0,
    marginy: 0,
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes with dynamic heights
  for (const contract of contracts) {
    const height = nodeHeights?.get(contract.name) || NODE_MIN_HEIGHT;
    g.setNode(contract.name, { width: NODE_WIDTH, height });
  }

  // Add edges (only within this group)
  // dep.from inherits from dep.to, so dep.to is the parent
  // For TB layout, we want parent at top, so: parent -> child
  for (const dep of dependencies) {
    if (dep.type !== 'inherits' && dep.type !== 'implements') continue;
    if (!contractNames.has(dep.from) || !contractNames.has(dep.to)) continue;
    // parent -> child for TB layout (parent at top)
    g.setEdge(dep.to, dep.from);
  }

  // Run dagre layout
  dagre.layout(g);

  // Extract positions and normalize to start from 0,0
  let minX = Infinity, minY = Infinity;
  for (const contract of contracts) {
    const node = g.node(contract.name);
    if (node) {
      const height = nodeHeights?.get(contract.name) || NODE_MIN_HEIGHT;
      minX = Math.min(minX, node.x - NODE_WIDTH / 2);
      minY = Math.min(minY, node.y - height / 2);
    }
  }

  for (const contract of contracts) {
    const node = g.node(contract.name);
    if (node) {
      const height = nodeHeights?.get(contract.name) || NODE_MIN_HEIGHT;
      const x = Math.round(node.x - NODE_WIDTH / 2 - minX);
      const y = Math.round(node.y - height / 2 - minY);
      positions.set(contract.name, { x, y });
    }
  }

  return positions;
}

/**
 * Calculate group dimensions based on hierarchical positions with dynamic heights
 */
function calculateHierarchicalGroupDimensions(
  positions: Map<string, { x: number; y: number }>,
  nodeHeights?: Map<string, number>,
  contracts?: Contract[]
): { width: number; height: number } {
  let maxX = 0, maxY = 0;

  for (const [name, pos] of positions.entries()) {
    const height = nodeHeights?.get(name) || NODE_MIN_HEIGHT;
    maxX = Math.max(maxX, pos.x + NODE_WIDTH);
    maxY = Math.max(maxY, pos.y + height);
  }

  // Add extra buffer for header, borders, shadows, and any rendering variations
  const EXTRA_HEIGHT_BUFFER = 80;
  return {
    width: maxX + CATEGORY_PADDING * 2,
    height: maxY + CATEGORY_PADDING * 2 + EXTRA_HEIGHT_BUFFER,
  };
}

/**
 * Create edges with logic:
 * - ERC7546 group: show delegatecall, registers, uses, inherits edges
 * - Same category: show thin individual lines
 * - To/from base contracts: show thin individual lines
 * - Different categories: hide by default, show only when selected
 * - When contract is selected: show all related lines with animation
 */
function createEdges(
  dependencies: Dependency[],
  nodePositions: Map<string, NodePosition>,
  _categoryBounds: Map<ContractCategory, CategoryBounds>,
  contractCategories: Map<string, ContractCategory>,
  contractGroups: Map<string, string>,  // contract name -> group id
  selectedContract: string | null
): Edge[] {
  const edges: Edge[] = [];

  // Track which edges are related to selected contract
  const selectedRelatedDeps = new Set<string>();
  if (selectedContract) {
    for (const dep of dependencies) {
      if (dep.from === selectedContract || dep.to === selectedContract) {
        selectedRelatedDeps.add(`${dep.from}-${dep.to}-${dep.type}`);
      }
    }
  }

  // Track created edges to prevent duplicates between same node pairs
  const createdEdgePairs = new Set<string>();

  // No offset - all edges start/end at the same handle point
  const getSourceOffset = (_nodeName: string, _direction: string): number => 0;
  const getTargetOffset = (_nodeName: string, _direction: string): number => 0;

  for (const dep of dependencies) {
    // Skip self-referencing edges
    if (dep.from === dep.to) continue;

    const sourcePos = nodePositions.get(dep.from);
    const targetPos = nodePositions.get(dep.to);
    if (!sourcePos || !targetPos) {
      continue;
    }

    // Skip edges where source and target are at the same position (would cause weird routing)
    if (sourcePos.x === targetPos.x && sourcePos.y === targetPos.y) continue;

    const sourceGroup = contractGroups.get(dep.from);
    const targetGroup = contractGroups.get(dep.to);
    const sourceCategory = contractCategories.get(dep.from);
    const targetCategory = contractCategories.get(dep.to);
    const isRelated = selectedRelatedDeps.has(`${dep.from}-${dep.to}-${dep.type}`);

    // Calculate direction for offset tracking
    const dx = targetPos.x - sourcePos.x;
    const dy = targetPos.y - sourcePos.y;
    const direction = Math.abs(dx) > Math.abs(dy)
      ? (dx > 0 ? 'right' : 'left')
      : (dy > 0 ? 'bottom' : 'top');
    const oppositeDir: Record<string, string> = { right: 'left', left: 'right', bottom: 'top', top: 'bottom' };

    // If this edge is related to selected contract, always show as individual line with highlight
    if (isRelated) {
      const sourceOffset = getSourceOffset(dep.from, direction);
      const targetOffset = getTargetOffset(dep.to, oppositeDir[direction]);
      const edge = createSingleEdge(dep, sourcePos, targetPos, true, 1, sourceOffset, targetOffset);
      if (edge) edges.push(edge);
      continue;
    }

    // Check if both contracts are in ERC7546 group
    const isErc7546Edge = sourceGroup?.startsWith('eip7546-') && targetGroup?.startsWith('eip7546-');

    // For ERC7546 group, show all relationship edges including inheritance
    if (isErc7546Edge) {
      // Only create one edge per node pair within ERC7546 to avoid duplicate lines
      const pairKey = `${dep.from}-${dep.to}`;
      if (!createdEdgePairs.has(pairKey)) {
        const sourceOffset = getSourceOffset(dep.from, direction);
        const targetOffset = getTargetOffset(dep.to, oppositeDir[direction]);
        // Use higher opacity for inheritance, lower for other types
        const opacity = (dep.type === 'inherits' || dep.type === 'implements') ? 0.7 : 0.6;
        const edge = createSingleEdge(dep, sourcePos, targetPos, false, opacity, sourceOffset, targetOffset);
        if (edge) {
          edges.push(edge);
          createdEdgePairs.add(pairKey);
        }
      }
      continue;
    }

    // For inheritance/implements, ALWAYS show (these are important relationships)
    if (dep.type === 'inherits' || dep.type === 'implements') {
      const involvesBase = sourceGroup === 'base' || targetGroup === 'base';
      const sameCategory = sourceCategory && targetCategory && sourceCategory === targetCategory;
      // Use higher opacity for visibility - inheritance relationships are important
      const opacity = (sameCategory || involvesBase) ? 0.7 : 0.5;
      const sourceOffset = getSourceOffset(dep.from, direction);
      const targetOffset = getTargetOffset(dep.to, oppositeDir[direction]);
      const edge = createSingleEdge(dep, sourcePos, targetPos, false, opacity, sourceOffset, targetOffset);
      if (edge) edges.push(edge);
      continue;
    }

    // For 'uses' edges (library usage), always show with moderate opacity
    if (dep.type === 'uses') {
      const sourceOffset = getSourceOffset(dep.from, direction);
      const targetOffset = getTargetOffset(dep.to, oppositeDir[direction]);
      const edge = createSingleEdge(dep, sourcePos, targetPos, false, 0.55, sourceOffset, targetOffset);
      if (edge) edges.push(edge);
      continue;
    }

    // Other edge types (delegatecall, etc.) between different categories: hide by default
    // These will only show when a contract is selected (handled above)
  }

  return edges;
}

function createSingleEdge(
  dep: Dependency,
  sourcePos: NodePosition,
  targetPos: NodePosition,
  isSelected: boolean,
  customOpacity?: number,
  sourceOffset: number = 0,
  targetOffset: number = 0
): Edge | null {
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;

  // Determine direction and use appropriate handles with -source/-target suffixes
  const direction = Math.abs(dx) > Math.abs(dy)
    ? (dx > 0 ? 'right' : 'left')
    : (dy > 0 ? 'bottom' : 'top');

  // Opposite direction for target handle
  const oppositeDirection: Record<string, string> = {
    right: 'left',
    left: 'right',
    bottom: 'top',
    top: 'bottom'
  };

  const sourceHandle = `${direction}-source`;
  const targetHandle = `${oppositeDirection[direction]}-target`;

  const opacity = customOpacity ?? (isSelected ? 1 : 0.5);
  const strokeWidth = isSelected ? 2.5 : 1.8;

  const baseEdge = {
    id: `${dep.from}-${dep.to}-${dep.type}${isSelected ? '-selected' : ''}`,
    source: dep.from,
    target: dep.to,
    type: 'dependencyEdge',
    sourceHandle,
    targetHandle,
    zIndex: isSelected ? 10 : 1,
  };

  const styles: Record<string, { stroke: string; dash?: string }> = {
    inherits: { stroke: '#60a5fa' },
    implements: { stroke: '#818cf8' },
    uses: { stroke: '#fbbf24', dash: '5,5' },
    delegatecall: { stroke: '#f472b6', dash: '8,4' },
    registers: { stroke: '#a78bfa', dash: '3,3' },
    imports: { stroke: '#94a3b8', dash: '2,2' },
  };

  const s = styles[dep.type];
  if (!s) return null;

  // Selected edges: flowing dotted line, thicker, higher z-index
  if (isSelected) {
    return {
      ...baseEdge,
      data: { type: dep.type, label: dep.type, isSelected: true, sourceOffset, targetOffset },
      style: {
        stroke: s.stroke,
        strokeWidth: 4,  // Much thicker for selected
        strokeDasharray: '8,4',  // Dotted pattern for animation
        opacity: 1,
      },
      zIndex: 1000,  // Above everything
      markerEnd: { type: MarkerType.ArrowClosed, color: s.stroke, width: 20, height: 20 },
      animated: true,  // Flowing animation
    };
  }

  return {
    ...baseEdge,
    data: { type: dep.type, label: dep.type, isSelected: false, sourceOffset, targetOffset },
    style: {
      stroke: s.stroke,
      strokeWidth,
      strokeDasharray: s.dash,
      opacity,
    },
    markerEnd: { type: MarkerType.ArrowClosed, color: s.stroke },
    animated: false,
  };
}

export function transformToReactFlow(
  callGraph: CallGraph,
  selectedContract: string | null,
  selectedFunction: string | null,
  options: TransformOptions = {}
): { nodes: Node[]; edges: Edge[] } {
  const { visibleCategories, layoutMode = 'grid', measuredHeights, showLibraryContracts = false } = options;
  const nodes: Node[] = [];
  const nodePositions = new Map<string, NodePosition>();
  const categoryBoundsMap = new Map<ContractCategory, CategoryBounds>();
  const contractCategories = new Map<string, ContractCategory>();
  const contractGroups = new Map<string, string>();  // contract name -> group id

  // Helper to extract library names from function calls
  const getLibraryCallsFromContract = (contract: Contract): string[] => {
    const libraryNames: string[] = [];
    const allFunctions = [...(contract.externalFunctions || []), ...(contract.internalFunctions || [])];
    for (const func of allFunctions) {
      for (const call of func.calls || []) {
        if (call.type === 'library' && call.target) {
          // Extract library name from "LibraryName.functionName"
          const libName = call.target.split('.')[0];
          if (libName && !libraryNames.includes(libName)) {
            libraryNames.push(libName);
          }
        }
      }
    }
    return libraryNames;
  };

  // Filter contracts
  // showLibraryContracts controls visibility of Solidity 'library' kind only
  // External library contracts (isExternalLibrary) that are inherited/used should ALWAYS be shown
  let contracts = callGraph.contracts.filter(c => {
    // Always exclude test contracts
    if (c.name.startsWith('Test')) return false;
    // Always exclude interfaces
    if (c.kind === 'interface') return false;
    // Regular contracts and abstract contracts: always include
    if (c.kind === 'contract' || c.kind === 'abstract') return true;
    // Solidity 'library' kind: only when showLibraryContracts is true
    if (c.kind === 'library' && showLibraryContracts) return true;
    return false;
  });

  if (visibleCategories) {
    contracts = contracts.filter(c => visibleCategories.includes(c.category));
  }

  // Helper function to check if a contract should be included
  const shouldIncludeContract = (contract: Contract): boolean => {
    // Always exclude test contracts
    if (contract.name.startsWith('Test')) return false;
    // Always exclude interfaces
    if (contract.kind === 'interface') return false;
    // Regular contracts and abstract contracts: always include (even if isExternalLibrary)
    if (contract.kind === 'contract' || contract.kind === 'abstract') return true;
    // Solidity 'library' kind: only when showLibraryContracts is true
    if (contract.kind === 'library') return showLibraryContracts;
    return true;
  };

  if (contracts.length === 0) {
    return { nodes: [], edges: [] };
  }

  // Build category map
  for (const c of contracts) {
    contractCategories.set(c.name, c.category);
  }

  // === STEP 0: Identify contracts with proxy patterns ===
  // Group contracts by their actual proxy pattern type
  // ERC-7546 is special: if it exists, other proxy patterns can be nested under it
  const contractsByPattern = new Map<ProxyPatternType, Contract[]>();

  // Create a map for looking up contracts by name from ALL contracts (including filtered out ones)
  // This is needed to find inherited contracts that may have been filtered
  // Include ALL contracts for lookup - filtering happens later when deciding what to display
  const allContractsMap = new Map<string, Contract>();
  for (const c of callGraph.contracts) {
    allContractsMap.set(c.name, c);
  }

  // First, check if there are any ERC-7546 contracts
  const hasErc7546 = contracts.some(c => c.proxyPattern === 'eip7546');

  // Collect contracts by their proxy pattern
  const allProxyContracts = contracts.filter(c => c.proxyPattern);

  // Build a combined lookup map for all contracts (for finding inherited contracts)
  const contractNameMap = new Map<string, Contract>();
  for (const c of contracts) {
    contractNameMap.set(c.name, c);
  }

  // Helper function to find a contract by name with fuzzy matching
  const findContractByName = (name: string): Contract | undefined => {
    // Try exact match first
    let found = allContractsMap.get(name) || contractNameMap.get(name);
    if (found) return found;

    // Try matching by contract name (for cases like "OwnableUpgradeable" in inherits)
    // Check if name ends with any contract's name or vice versa
    for (const [contractName, contract] of allContractsMap) {
      if (name === contractName || name.endsWith(contractName) || contractName.endsWith(name)) {
        return contract;
      }
    }
    for (const [contractName, contract] of contractNameMap) {
      if (name === contractName || name.endsWith(contractName) || contractName.endsWith(name)) {
        return contract;
      }
    }

    return undefined;
  };

  if (hasErc7546) {
    // ERC-7546 exists: group all proxy contracts under ERC-7546
    if (allProxyContracts.length > 0) {
      contractsByPattern.set('eip7546', allProxyContracts);
    }

    // Include contracts that ERC-7546 contracts inherit from
    const erc7546Contracts = contractsByPattern.get('eip7546');
    if (erc7546Contracts && erc7546Contracts.length > 0) {
      const patternNames = new Set(erc7546Contracts.map(c => c.name));
      const additionalContracts: Contract[] = [];

      // Collect all related names from ERC7546 contracts first
      const processContract = (contract: Contract) => {
        const relatedNames = [
          ...(contract.inherits || []),
          ...(contract.implements || []),
          ...(contract.usesLibraries || []),
          ...getLibraryCallsFromContract(contract),
        ];

        for (const relatedName of relatedNames) {
          if (patternNames.has(relatedName)) continue;

          // Try to find the contract with fuzzy matching
          const targetContract = findContractByName(relatedName);

          if (!targetContract) continue;
          if (patternNames.has(targetContract.name)) continue;

          if (targetContract.name.startsWith('Test')) continue;
          if (targetContract.kind === 'interface') continue;
          // Respect showLibraryContracts setting for Solidity library contracts
          if (targetContract.kind === 'library' && !showLibraryContracts) continue;

          if (contract.proxyRole && !targetContract.proxyRole) {
            targetContract.proxyRole = contract.proxyRole;
          }

          additionalContracts.push(targetContract);
          patternNames.add(targetContract.name);
        }
      };

      // Process initial ERC7546 contracts
      for (const contract of erc7546Contracts) {
        processContract(contract);
      }

      // Process newly added contracts (limited iterations to prevent infinite loops)
      let lastProcessedIndex = 0;
      for (let i = 0; i < 10 && lastProcessedIndex < additionalContracts.length; i++) {
        const currentLength = additionalContracts.length;
        for (let j = lastProcessedIndex; j < currentLength; j++) {
          processContract(additionalContracts[j]);
        }
        lastProcessedIndex = currentLength;
      }

      // Also check dependencies array for inheritance relationships
      const relevantDeps = callGraph.dependencies.filter(
        dep => dep.type === 'inherits' || dep.type === 'implements' || dep.type === 'uses'
      );

      // Forward lookup: if dep.from is in group, add dep.to (the parent/inherited contract)
      for (const dep of relevantDeps) {
        if (!patternNames.has(dep.from)) continue;
        if (patternNames.has(dep.to)) continue;

        const targetContract = findContractByName(dep.to);

        if (!targetContract) continue;
        if (patternNames.has(targetContract.name)) continue;
        if (targetContract.name.startsWith('Test')) continue;
        if (targetContract.kind === 'interface') continue;
        // Respect showLibraryContracts setting for Solidity library contracts
        if (targetContract.kind === 'library' && !showLibraryContracts) continue;

        // Find the inheriting contract to copy proxyRole
        const inheritingContract = erc7546Contracts.find(c => c.name === dep.from) ||
          additionalContracts.find(c => c.name === dep.from);
        if (inheritingContract?.proxyRole && !targetContract.proxyRole) {
          targetContract.proxyRole = inheritingContract.proxyRole;
        }

        additionalContracts.push(targetContract);
        patternNames.add(targetContract.name);
      }

      // Reverse lookup: if dep.to is in group, add dep.from (the child/inheriting contract)
      // This catches contracts like AccessControl (inherits ERC165) and ERC721Enumerable (inherits ERC721)
      let addedInReverse = true;
      for (let iter = 0; iter < 10 && addedInReverse; iter++) {
        addedInReverse = false;
        for (const dep of relevantDeps) {
          // Only process inherits/implements for reverse lookup (not 'uses')
          if (dep.type !== 'inherits' && dep.type !== 'implements') continue;
          // Skip if the parent (dep.to) is not in group
          if (!patternNames.has(dep.to)) continue;
          // Skip if the child (dep.from) is already in group
          if (patternNames.has(dep.from)) continue;

          const childContract = findContractByName(dep.from);

          if (!childContract) continue;
          if (patternNames.has(childContract.name)) continue;
          if (childContract.name.startsWith('Test')) continue;
          if (childContract.kind === 'interface') continue;
          // Respect showLibraryContracts setting for Solidity library contracts
          if (childContract.kind === 'library' && !showLibraryContracts) continue;

          // Copy proxyRole from parent if available
          const parentContract = erc7546Contracts.find(c => c.name === dep.to) ||
            additionalContracts.find(c => c.name === dep.to);
          if (parentContract?.proxyRole && !childContract.proxyRole) {
            childContract.proxyRole = parentContract.proxyRole;
          }

          additionalContracts.push(childContract);
          patternNames.add(childContract.name);
          addedInReverse = true;
        }
      }

      // Add additional contracts to the main contracts list if needed
      for (const contract of additionalContracts) {
        if (!contractNameMap.has(contract.name)) {
          contracts.push(contract);
          contractNameMap.set(contract.name, contract);
          contractCategories.set(contract.name, contract.category);
        }
      }

      if (additionalContracts.length > 0) {
        contractsByPattern.set('eip7546', [...erc7546Contracts, ...additionalContracts]);
      }
    }
  } else {
    // No ERC-7546: group each proxy pattern separately
    // Track which contracts have been added to avoid duplicates
    const addedContractNames = new Set<string>();
    for (const contract of allProxyContracts) {
      // Skip if already added to another pattern group
      if (addedContractNames.has(contract.name)) continue;

      const pattern = contract.proxyPattern as ProxyPatternType;
      if (!contractsByPattern.has(pattern)) {
        contractsByPattern.set(pattern, []);
      }
      contractsByPattern.get(pattern)!.push(contract);
      addedContractNames.add(contract.name);
    }

    // Pre-filter dependencies for relevant types
    const relevantDeps = callGraph.dependencies.filter(
      dep => dep.type === 'inherits' || dep.type === 'implements' || dep.type === 'uses'
    );

    // Include contracts that proxy pattern contracts inherit from (for each pattern)
    for (const [patternType, patternContracts] of contractsByPattern.entries()) {
      const patternNames = new Set(patternContracts.map(c => c.name));
      const additionalContracts: Contract[] = [];

      // Helper to process a contract and find related contracts
      const processContract = (contractInGroup: Contract) => {
        const relatedNames = [
          ...(contractInGroup.inherits || []),
          ...(contractInGroup.implements || []),
          ...(contractInGroup.usesLibraries || []),
          ...getLibraryCallsFromContract(contractInGroup),
        ];

        for (const relatedName of relatedNames) {
          if (patternNames.has(relatedName)) continue;
          if (addedContractNames.has(relatedName)) continue;

          const targetContract = findContractByName(relatedName);
          if (!targetContract) continue;
          if (patternNames.has(targetContract.name)) continue;
          if (addedContractNames.has(targetContract.name)) continue;

          if (targetContract.name.startsWith('Test')) continue;
          if (targetContract.kind === 'interface') continue;
          // Respect showLibraryContracts setting for Solidity library contracts
          if (targetContract.kind === 'library' && !showLibraryContracts) continue;

          if (contractInGroup.proxyRole && !targetContract.proxyRole) {
            targetContract.proxyRole = contractInGroup.proxyRole;
          }

          additionalContracts.push(targetContract);
          patternNames.add(targetContract.name);
          addedContractNames.add(targetContract.name);
          if (!contractNameMap.has(targetContract.name)) {
            contracts.push(targetContract);
            contractNameMap.set(targetContract.name, targetContract);
            contractCategories.set(targetContract.name, targetContract.category);
          }
        }
      };

      // Process initial proxy contracts
      for (const contract of patternContracts) {
        processContract(contract);
      }

      // Process newly added contracts (limited iterations to prevent infinite loops)
      let lastProcessedIndex = 0;
      for (let iteration = 0; iteration < 10 && lastProcessedIndex < additionalContracts.length; iteration++) {
        const currentLength = additionalContracts.length;
        for (let j = lastProcessedIndex; j < currentLength; j++) {
          processContract(additionalContracts[j]);
        }
        lastProcessedIndex = currentLength;
      }

      // Also check dependencies (single pass, using pattern membership)
      for (const dep of relevantDeps) {
        if (!patternNames.has(dep.from)) continue;
        if (patternNames.has(dep.to)) continue;
        if (addedContractNames.has(dep.to)) continue;

        const targetContract = findContractByName(dep.to);
        if (!targetContract) continue;
        if (patternNames.has(targetContract.name)) continue;
        if (addedContractNames.has(targetContract.name)) continue;
        if (targetContract.name.startsWith('Test')) continue;
        if (targetContract.kind === 'interface') continue;
        // Respect showLibraryContracts setting for Solidity library contracts
        if (targetContract.kind === 'library' && !showLibraryContracts) continue;

        const inheritingContract = patternContracts.find(c => c.name === dep.from) ||
          additionalContracts.find(c => c.name === dep.from);
        if (inheritingContract?.proxyRole && !targetContract.proxyRole) {
          targetContract.proxyRole = inheritingContract.proxyRole;
        }

        additionalContracts.push(targetContract);
        patternNames.add(targetContract.name);
        addedContractNames.add(targetContract.name);
        if (!contractNameMap.has(targetContract.name)) {
          contracts.push(targetContract);
          contractNameMap.set(targetContract.name, targetContract);
          contractCategories.set(targetContract.name, targetContract.category);
        }
      }

      if (additionalContracts.length > 0) {
        contractsByPattern.set(patternType, [...patternContracts, ...additionalContracts]);
      }
    }
  }

  // Get all contracts that are part of any proxy pattern group
  const proxyPatternContractNames = new Set<string>();
  for (const patternContracts of contractsByPattern.values()) {
    for (const c of patternContracts) {
      proxyPatternContractNames.add(c.name);
    }
  }

  const nonProxyPatternContracts = contracts.filter(c => !proxyPatternContractNames.has(c.name));

  // Layout constants
  const startX = 100;
  let currentY = 100;
  const COLUMN_GAP = 80;           // Gap between category columns
  const ROW_GAP = 80;              // Gap between rows (vertical layout)
  const SUB_CATEGORY_GAP = 70;     // Gap between sub-category groups
  const CONTRACTS_PER_ROW = 3;  // 3 columns for better horizontal spread
  const PROXY_GROUP_PADDING = 80;

  // Get column count for category (same for all)
  const getColumnsForCategory = (_category: ContractCategory): number => {
    return CONTRACTS_PER_ROW;
  };
  const ERC7546_INNER_GAP = 60;
  const ERC7546_SECTION_GAP = 100;

  interface GroupPosition {
    group: GroupInfo;
    x: number;
    y: number;
    width: number;
    height: number;
  }

  // === Pre-calculate all node heights ===
  // Use measured heights if available (from actual DOM), otherwise use calculated estimates
  const nodeHeights = new Map<string, number>();
  for (const contract of contracts) {
    const measured = measuredHeights?.get(contract.name);
    // Add generous buffer to measured heights to ensure no overflow
    // The buffer accounts for rendering variations, margins, borders, shadows,
    // font loading, and any potential reflow issues
    const height = measured ? measured + 50 : calculateNodeHeight(contract);
    nodeHeights.set(contract.name, height);
  }

  // === STEP 1: Layout all proxy pattern groups ===
  // Calculate dimensions helper with dynamic heights
  const calcDimensions = (contractList: Contract[], maxCols: number) => {
    const cols = Math.min(contractList.length, maxCols);
    const rows = Math.ceil(contractList.length / maxCols);
    const width = cols * NODE_WIDTH + (cols - 1) * NODE_GAP_X + CATEGORY_PADDING * 2;

    // Calculate height based on max height per row
    let totalHeight = 0;
    for (let row = 0; row < rows; row++) {
      let maxRowHeight = 0;
      for (let col = 0; col < cols; col++) {
        const idx = row * maxCols + col;
        if (idx < contractList.length) {
          const h = nodeHeights.get(contractList[idx].name) || NODE_MIN_HEIGHT;
          maxRowHeight = Math.max(maxRowHeight, h);
        }
      }
      totalHeight += maxRowHeight;
      if (row < rows - 1) totalHeight += NODE_GAP_Y;
    }

    // Add padding
    // CATEGORY_PADDING at top (where contracts start) + CATEGORY_PADDING at bottom
    // Header badge overlaps the top edge, so no extra space needed
    const height = totalHeight + CATEGORY_PADDING * 2;
    return { cols, rows, width, height };
  };

  // Calculate row-based positions for contracts (returns positions relative to group)
  // Also returns the calculated bounds based on actual positions
  // If useHierarchy is true, uses dagre layout based on inheritance relationships
  const calcContractPositions = (
    contractList: Contract[],
    maxCols: number,
    useHierarchy: boolean = false
  ) => {
    // Try hierarchical layout first if requested
    if (useHierarchy && contractList.length > 1) {
      const hierarchyPositions = calculateHierarchicalPositions(
        contractList,
        callGraph.dependencies,
        nodeHeights
      );

      if (hierarchyPositions.size > 0) {
        // Use dagre positions
        const positions: { contract: Contract; x: number; y: number; height: number }[] = [];
        let maxX = 0;
        let maxY = 0;

        for (const contract of contractList) {
          const pos = hierarchyPositions.get(contract.name);
          const h = nodeHeights.get(contract.name) || NODE_MIN_HEIGHT;

          if (pos) {
            positions.push({
              contract,
              x: CATEGORY_PADDING + pos.x,
              y: CATEGORY_PADDING + pos.y,
              height: h,
            });
            maxX = Math.max(maxX, CATEGORY_PADDING + pos.x + NODE_WIDTH);
            maxY = Math.max(maxY, CATEGORY_PADDING + pos.y + h);
          } else {
            // Fallback position
            positions.push({
              contract,
              x: CATEGORY_PADDING,
              y: CATEGORY_PADDING,
              height: h,
            });
          }
        }

        return {
          positions,
          width: maxX + CATEGORY_PADDING,
          height: maxY + CATEGORY_PADDING,
        };
      }
    }

    // Fallback to grid layout
    const positions: { contract: Contract; x: number; y: number; height: number }[] = [];
    let currentY = CATEGORY_PADDING;
    let maxX = 0;  // Track rightmost edge

    for (let row = 0; row < Math.ceil(contractList.length / maxCols); row++) {
      // Find max height in this row
      let maxRowHeight = 0;
      const rowContracts: Contract[] = [];
      for (let col = 0; col < maxCols; col++) {
        const idx = row * maxCols + col;
        if (idx < contractList.length) {
          const contract = contractList[idx];
          rowContracts.push(contract);
          const h = nodeHeights.get(contract.name) || NODE_MIN_HEIGHT;
          maxRowHeight = Math.max(maxRowHeight, h);
        }
      }

      // Position contracts in this row
      for (let col = 0; col < rowContracts.length; col++) {
        const contract = rowContracts[col];
        const h = nodeHeights.get(contract.name) || NODE_MIN_HEIGHT;
        const x = CATEGORY_PADDING + col * (NODE_WIDTH + NODE_GAP_X);
        positions.push({
          contract,
          x,
          y: currentY,
          height: h,
        });
        // Track rightmost edge (x + NODE_WIDTH)
        maxX = Math.max(maxX, x + NODE_WIDTH);
      }

      currentY += maxRowHeight + NODE_GAP_Y;
    }

    // Calculate actual bounds from positions
    // Remove the last NODE_GAP_Y since there's no row after the last one
    const actualHeight = currentY - NODE_GAP_Y + CATEGORY_PADDING;
    const actualWidth = maxX + CATEGORY_PADDING;

    return { positions, width: actualWidth, height: actualHeight };
  };

  // Role labels for display (no emoji - CategoryGroupNode adds icon from style)
  const ROLE_LABELS: Record<string, string> = {
    proxy: 'Proxy',
    implementation: 'Implementation',
    dictionary: 'Dictionary',
    beacon: 'Beacon',
    facet: 'Facet',
    interface: 'Interface',
    library: 'Library',
  };

  // Pattern labels for display
  const PATTERN_LABELS: Record<ProxyPatternType, string> = {
    eip7546: 'ERC-7546',
    uups: 'UUPS',
    transparent: 'Transparent Proxy',
    diamond: 'Diamond (EIP-2535)',
    beacon: 'Beacon Proxy',
  };

  // Process each proxy pattern group
  for (const patternType of contractsByPattern.keys()) {
    const patternContracts = contractsByPattern.get(patternType);
    if (!patternContracts || patternContracts.length === 0) continue;

    // Group contracts by role
    const byRole = new Map<string, Contract[]>();
    for (const c of patternContracts) {
      const role = c.proxyRole || 'other';
      const list = byRole.get(role) || [];
      list.push(c);
      byRole.set(role, list);
    }

    // Sort each role group
    for (const list of byRole.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Define role order for each pattern
    const roleOrder = patternType === 'diamond'
      ? ['proxy', 'facet', 'library', 'interface', 'implementation', 'other']
      : patternType === 'beacon'
        ? ['beacon', 'proxy', 'implementation', 'other']
        : patternType === 'eip7546'
          ? ['proxy', 'dictionary', 'implementation', 'other']
          : ['proxy', 'implementation', 'other'];

    // Layout roles vertically for ERC7546: Proxy -> Dictionary -> Implementations (by category, side by side)
    interface RoleLayout {
      role: string;
      category?: ContractCategory;  // For implementation sub-groups
      label: string;
      contracts: Contract[];
      x: number;
      y: number;
      width: number;
      height: number;
    }
    const roleLayouts: RoleLayout[] = [];
    let currentRoleY = 0;
    let maxWidth = 0;

    // For ERC7546: vertical layout (Proxy on top, Dictionary below, Implementations at bottom)
    const useVerticalLayout = patternType === 'eip7546';

    if (useVerticalLayout) {
      // Vertical layout for ERC7546
      for (const role of roleOrder) {
        const roleContracts = byRole.get(role);
        if (!roleContracts || roleContracts.length === 0) continue;

        if (role === 'implementation' && roleContracts.length > 2) {
          // Group implementations by category, laid out horizontally within this row
          const byCategory = new Map<ContractCategory, Contract[]>();
          for (const c of roleContracts) {
            const list = byCategory.get(c.category) || [];
            list.push(c);
            byCategory.set(c.category, list);
          }

          const implCategoryOrder = getCategoryOrder(roleContracts);
          let implX = 0;
          let implMaxHeight = 0;

          for (const category of implCategoryOrder) {
            const catContracts = byCategory.get(category);
            if (!catContracts || catContracts.length === 0) continue;

            catContracts.sort((a, b) => a.name.localeCompare(b.name));
            const maxCols = catContracts.length <= 3 ? catContracts.length : 3;
            // Use hierarchy layout for implementation groups
            const { width, height } = calcContractPositions(catContracts, maxCols, layoutMode === 'hierarchy');

            roleLayouts.push({
              role: 'implementation',
              category,
              label: getCategoryLabel(category),
              contracts: catContracts,
              x: implX,
              y: currentRoleY,
              width,
              height,
            });

            implX += width + COLUMN_GAP;
            implMaxHeight = Math.max(implMaxHeight, height);
          }

          maxWidth = Math.max(maxWidth, implX > 0 ? implX - COLUMN_GAP : 0);
          currentRoleY += implMaxHeight + ROW_GAP;
        } else {
          // Single role group (Proxy, Dictionary, or small implementation)
          roleContracts.sort((a, b) => a.name.localeCompare(b.name));
          // Use consistent maxCols: 3 columns max
          const maxCols = roleContracts.length <= 3 ? roleContracts.length : 3;
          // Use hierarchy layout for all role groups
          const { width, height } = calcContractPositions(roleContracts, maxCols, layoutMode === 'hierarchy');

          roleLayouts.push({
            role,
            label: ROLE_LABELS[role] || role,
            contracts: roleContracts,
            x: 0,
            y: currentRoleY,
            width,
            height,
          });

          maxWidth = Math.max(maxWidth, width);
          currentRoleY += height + ROW_GAP;
        }
      }
    } else {
      // Horizontal layout for other patterns (UUPS, Transparent, etc.)
      let currentRoleX = 0;
      let maxRoleHeight = 0;

      for (const role of roleOrder) {
        const roleContracts = byRole.get(role);
        if (!roleContracts || roleContracts.length === 0) continue;

        if (role === 'implementation' && roleContracts.length > 2) {
          const byCategory = new Map<ContractCategory, Contract[]>();
          for (const c of roleContracts) {
            const list = byCategory.get(c.category) || [];
            list.push(c);
            byCategory.set(c.category, list);
          }

          const implCategoryOrder = getCategoryOrder(roleContracts);

          for (const category of implCategoryOrder) {
            const catContracts = byCategory.get(category);
            if (!catContracts || catContracts.length === 0) continue;

            catContracts.sort((a, b) => a.name.localeCompare(b.name));
            const maxCols = catContracts.length <= 3 ? catContracts.length : 3;
            // Use hierarchy layout
            const { width, height } = calcContractPositions(catContracts, maxCols, layoutMode === 'hierarchy');

            roleLayouts.push({
              role: 'implementation',
              category,
              label: getCategoryLabel(category),
              contracts: catContracts,
              x: currentRoleX,
              y: 0,
              width,
              height,
            });

            currentRoleX += width + COLUMN_GAP;
            maxRoleHeight = Math.max(maxRoleHeight, height);
          }
        } else {
          const maxCols = roleContracts.length <= 3 ? roleContracts.length : 3;
          // Use hierarchy layout
          const { width, height } = calcContractPositions(roleContracts, maxCols, layoutMode === 'hierarchy');

          roleLayouts.push({
            role,
            label: ROLE_LABELS[role] || role,
            contracts: roleContracts,
            x: currentRoleX,
            y: 0,
            width,
            height,
          });

          currentRoleX += width + COLUMN_GAP;
          maxRoleHeight = Math.max(maxRoleHeight, height);
        }
      }

      maxWidth = currentRoleX > 0 ? currentRoleX - COLUMN_GAP : 0;
      // For horizontal layout, no ROW_GAP was added, so don't subtract it
      currentRoleY = maxRoleHeight + ROW_GAP; // Add ROW_GAP so the subtraction below works correctly
    }

    // Calculate total group dimensions
    // Note: Pattern group header is positioned outside with -top-4, so no extra space needed
    // Subtract ROW_GAP because it was added after the last role (for both vertical and horizontal layouts now)
    const totalInnerHeight = currentRoleY > 0 ? currentRoleY - ROW_GAP : 0;
    const groupWidth = maxWidth + PROXY_GROUP_PADDING * 2;
    const groupHeight = totalInnerHeight + PROXY_GROUP_PADDING * 2;

    // Create pattern group node (outer container)
    const patternGroupId = `proxy-pattern-${patternType}`;
    nodes.push({
      id: patternGroupId,
      type: 'proxyPatternGroupNode',
      position: { x: startX, y: currentY },
      data: {
        patternType,
        label: PATTERN_LABELS[patternType],
        contractCount: patternContracts.length,
      } as ProxyPatternGroupNodeData,
      style: {
        width: `${groupWidth}px`,
        height: `${groupHeight}px`,
      },
      selectable: false,
      draggable: true,
      zIndex: -1,
    });

    // Create role group nodes inside pattern group
    const contentStartX = PROXY_GROUP_PADDING;
    const contentStartY = PROXY_GROUP_PADDING; // Role group header is also positioned outside

    for (const layout of roleLayouts) {
      // Skip empty role groups
      if (layout.contracts.length === 0) continue;

      // Include category in ID for implementation sub-groups to ensure uniqueness
      const roleGroupId = layout.category
        ? `${patternType}-role-${layout.role}-${layout.category}`
        : `${patternType}-role-${layout.role}`;
      const groupAbsX = startX + contentStartX + layout.x;
      const groupAbsY = currentY + contentStartY + layout.y;

      // Determine category for styling - use role-specific category for proxy/dictionary
      const roleCategory = layout.category
        ? layout.category
        : (layout.role === 'dictionary' ? 'dictionary-role' : `${layout.role}-role`) as ContractCategory;

      // Role group node
      nodes.push({
        id: roleGroupId,
        type: 'categoryGroupNode',
        position: { x: contentStartX + layout.x, y: contentStartY + layout.y },
        parentId: patternGroupId,
        extent: 'parent',
        data: {
          category: roleCategory,
          label: layout.label,
          contractCount: layout.contracts.length,
        } as CategoryGroupNodeData,
        style: {
          width: `${layout.width}px`,
          height: `${layout.height}px`,
        },
        selectable: false,
        draggable: false,
      });

      // Position contracts inside this role group with dynamic heights and hierarchy
      const maxCols = layout.contracts.length <= 3 ? layout.contracts.length : 3;
      const { positions: contractPositions } = calcContractPositions(layout.contracts, maxCols, layoutMode === 'hierarchy');

      for (const pos of contractPositions) {
        const relativePosition = { x: pos.x, y: pos.y };
        const absolutePosition = {
          x: groupAbsX + pos.x,
          y: groupAbsY + pos.y,
        };
        nodePositions.set(pos.contract.name, absolutePosition);
        contractGroups.set(pos.contract.name, roleGroupId);

        nodes.push({
          id: pos.contract.name,
          type: 'contractNode',
          position: relativePosition,
          parentId: roleGroupId,
          extent: 'parent',
          data: {
            contract: pos.contract,
            isSelected: selectedContract === pos.contract.name,
            selectedFunction: selectedContract === pos.contract.name ? selectedFunction : null,
            nodeHeight: pos.height,
          } as ContractNodeData,
          draggable: false,
        });
      }
    }

    currentY += groupHeight + ERC7546_SECTION_GAP;
  }

  // === STEP 2: Handle non-proxy-pattern contracts with category groups ===
  const groupPositions: GroupPosition[] = [];

  if (nonProxyPatternContracts.length > 0) {
    // Analyze inheritance patterns
    const inheritanceInfo = analyzeInheritance(nonProxyPatternContracts, callGraph.dependencies);

    // Identify base contracts
    const baseContracts = new Set<string>();
    for (const contract of nonProxyPatternContracts) {
      if (isBaseContract(contract.name, inheritanceInfo)) {
        baseContracts.add(contract.name);
      }
    }

    // Separate base and category contracts
    const categoryContracts = nonProxyPatternContracts.filter(c => !baseContracts.has(c.name));
    const baseContractList = nonProxyPatternContracts.filter(c => baseContracts.has(c.name));

    // Position base contracts
    if (baseContractList.length > 0) {
      baseContractList.sort((a, b) => {
        const aInfo = inheritanceInfo.get(a.name);
        const bInfo = inheritanceInfo.get(b.name);
        const aCount = aInfo ? aInfo.otherCategories.size : 0;
        const bCount = bInfo ? bInfo.otherCategories.size : 0;
        return bCount - aCount;
      });

      let baseX = startX;
      let maxBaseHeight = 0;
      for (const contract of baseContractList) {
        const height = nodeHeights.get(contract.name) || NODE_MIN_HEIGHT;
        maxBaseHeight = Math.max(maxBaseHeight, height);

        const position = { x: baseX, y: currentY };
        nodePositions.set(contract.name, position);
        contractGroups.set(contract.name, 'base');

        nodes.push({
          id: contract.name,
          type: 'contractNode',
          position,
          data: {
            contract,
            isSelected: selectedContract === contract.name,
            selectedFunction: selectedContract === contract.name ? selectedFunction : null,
            nodeHeight: height,
          } as ContractNodeData,
          zIndex: 10,
        });

        baseX += NODE_WIDTH + NODE_GAP_X;
      }

      currentY += maxBaseHeight + 80;
    }

    // Group remaining contracts by category
    const groups = groupContractsWithSubCategories(categoryContracts);
    const categoryColumns = new Map<ContractCategory, GroupInfo[]>();
    for (const group of groups) {
      const existing = categoryColumns.get(group.category) || [];
      existing.push(group);
      categoryColumns.set(group.category, existing);
    }

    // Pre-calculate hierarchical positions
    const groupHierarchyPositions = new Map<string, Map<string, { x: number; y: number }>>();
    if (layoutMode === 'hierarchy') {
      for (const group of groups) {
        const positions = calculateHierarchicalPositions(group.contracts, callGraph.dependencies, nodeHeights);
        groupHierarchyPositions.set(group.id, positions);
      }
    }

    // Get dynamic category order
    const nonProxyCategoryOrder = getCategoryOrder(categoryContracts);

    // Position category columns - spread sub-categories across multiple columns if there are many
    const SUBCATEGORY_COLS = 3;  // Max sub-category columns per category
    let currentX = startX;

    for (const category of nonProxyCategoryOrder) {
      const categoryGroups = categoryColumns.get(category);
      if (!categoryGroups || categoryGroups.length === 0) continue;

      // Calculate dimensions for all groups first
      const groupDims: { group: GroupInfo; width: number; height: number }[] = [];
      for (const group of categoryGroups) {
        let width: number;
        let height: number;

        if (layoutMode === 'hierarchy') {
          const hierarchyPositions = groupHierarchyPositions.get(group.id);
          const colsForCategory = getColumnsForCategory(group.category);
          if (hierarchyPositions && hierarchyPositions.size > 0) {
            const dims = calculateHierarchicalGroupDimensions(hierarchyPositions, nodeHeights, group.contracts);
            width = dims.width;
            height = dims.height;
          } else {
            // Fallback: use calcContractPositions with hierarchy mode
            const { width: actualWidth, height: actualHeight } = calcContractPositions(group.contracts, colsForCategory, layoutMode === 'hierarchy');
            width = actualWidth;
            height = actualHeight;
          }
        } else {
          const colsForCategory = getColumnsForCategory(group.category);
          const { width: actualWidth, height: actualHeight } = calcContractPositions(group.contracts, colsForCategory, false);
          width = actualWidth;
          height = actualHeight;
        }
        groupDims.push({ group, width, height });
      }

      // Determine number of columns based on group count
      const numSubCols = Math.min(SUBCATEGORY_COLS, groupDims.length);
      const groupsPerCol = Math.ceil(groupDims.length / numSubCols);

      // Position groups in grid layout
      let subColX = currentX;
      let maxTotalWidth = 0;

      for (let col = 0; col < numSubCols; col++) {
        let columnY = currentY;
        let maxColWidth = 0;

        for (let row = 0; row < groupsPerCol; row++) {
          const idx = col * groupsPerCol + row;
          if (idx >= groupDims.length) break;

          const { group, width, height } = groupDims[idx];

          groupPositions.push({
            group,
            x: subColX + CATEGORY_PADDING,
            y: columnY + CATEGORY_PADDING,
            width,
            height,
          });

          maxColWidth = Math.max(maxColWidth, width);
          columnY += height + SUB_CATEGORY_GAP;
        }

        subColX += maxColWidth + COLUMN_GAP;
        maxTotalWidth = subColX - currentX - COLUMN_GAP;
      }

      currentX += maxTotalWidth + COLUMN_GAP;
    }

    // Create category group nodes and position contracts
    const groupBoundsMap = new Map<string, CategoryBounds & { groupId: string }>();

    for (const pos of groupPositions) {
      const { group } = pos;
      const groupNodeId = `category-${group.id}`;

      const bounds = {
        x: pos.x - CATEGORY_PADDING,
        y: pos.y - CATEGORY_PADDING,
        width: pos.width,
        height: pos.height,
        category: group.category,
        groupId: group.id,
      };
      groupBoundsMap.set(group.id, bounds);

      if (!categoryBoundsMap.has(group.category)) {
        categoryBoundsMap.set(group.category, bounds);
      }

      nodes.push({
        id: groupNodeId,
        type: 'categoryGroupNode',
        position: { x: pos.x - CATEGORY_PADDING, y: pos.y - CATEGORY_PADDING },
        data: {
          category: group.category,
          subCategory: group.subCategory,
          label: group.label,
          contractCount: group.contracts.length,
        } as CategoryGroupNodeData,
        style: {
          width: `${pos.width}px`,
          height: `${pos.height}px`,
        },
        selectable: false,
        draggable: true,
      });

      const hierarchyPositions = groupHierarchyPositions.get(group.id);

      if (layoutMode === 'hierarchy' && hierarchyPositions && hierarchyPositions.size > 0) {
        // Hierarchy layout - use dagre positions
        for (const contract of group.contracts) {
          const hierPos = hierarchyPositions.get(contract.name);
          const height = nodeHeights.get(contract.name) || NODE_MIN_HEIGHT;

          const relativePosition = hierPos
            ? { x: CATEGORY_PADDING + hierPos.x, y: CATEGORY_PADDING + hierPos.y }
            : { x: CATEGORY_PADDING, y: CATEGORY_PADDING };

          const absolutePosition = {
            x: pos.x - CATEGORY_PADDING + relativePosition.x,
            y: pos.y - CATEGORY_PADDING + relativePosition.y,
          };
          nodePositions.set(contract.name, absolutePosition);
          contractGroups.set(contract.name, group.id);

          nodes.push({
            id: contract.name,
            type: 'contractNode',
            position: relativePosition,
            parentId: groupNodeId,
            extent: 'parent',
            data: {
              contract,
              isSelected: selectedContract === contract.name,
              selectedFunction: selectedContract === contract.name ? selectedFunction : null,
              nodeHeight: height,
            } as ContractNodeData,
            draggable: false,
          });
        }
      } else {
        // Grid layout - use dynamic height positions
        const colsForCategory = getColumnsForCategory(group.category);
        const { positions: contractPositions } = calcContractPositions(group.contracts, colsForCategory);

        for (const cpos of contractPositions) {
          const relativePosition = { x: cpos.x, y: cpos.y };
          const absolutePosition = {
            x: pos.x - CATEGORY_PADDING + cpos.x,
            y: pos.y - CATEGORY_PADDING + cpos.y,
          };
          nodePositions.set(cpos.contract.name, absolutePosition);
          contractGroups.set(cpos.contract.name, group.id);

          nodes.push({
            id: cpos.contract.name,
            type: 'contractNode',
            position: relativePosition,
            parentId: groupNodeId,
            extent: 'parent',
            data: {
              contract: cpos.contract,
              isSelected: selectedContract === cpos.contract.name,
              selectedFunction: selectedContract === cpos.contract.name ? selectedFunction : null,
              nodeHeight: cpos.height,
            } as ContractNodeData,
            draggable: false,
          });
        }
      }
    }
  }

  // Get set of actual node IDs that are rendered
  const renderedNodeIds = new Set(nodes.filter(n => n.type === 'contractNode').map(n => n.id));

  // Generate 'uses' dependencies from usesLibraries and library calls
  const allDependencies = [...callGraph.dependencies];
  const existingDeps = new Set(callGraph.dependencies.map(d => `${d.from}-${d.to}-${d.type}`));

  for (const contract of contracts) {
    // Add 'uses' dependencies from usesLibraries
    for (const libName of contract.usesLibraries || []) {
      const depKey = `${contract.name}-${libName}-uses`;
      if (!existingDeps.has(depKey) && renderedNodeIds.has(libName)) {
        allDependencies.push({
          from: contract.name,
          to: libName,
          type: 'uses',
        });
        existingDeps.add(depKey);
      }
    }

    // Add 'uses' dependencies from direct library calls
    const libraryCalls = getLibraryCallsFromContract(contract);
    for (const libName of libraryCalls) {
      const depKey = `${contract.name}-${libName}-uses`;
      if (!existingDeps.has(depKey) && renderedNodeIds.has(libName)) {
        allDependencies.push({
          from: contract.name,
          to: libName,
          type: 'uses',
        });
        existingDeps.add(depKey);
      }
    }
  }

  // Create edges from dependencies (only for rendered nodes)
  let edges = createEdges(
    allDependencies,
    nodePositions,
    categoryBoundsMap,
    contractCategories,
    contractGroups,
    selectedContract
  );

  // Filter edges to only include those where both source and target are rendered
  edges = edges.filter(e => renderedNodeIds.has(e.source) && renderedNodeIds.has(e.target));

  // Filter out deleted edges
  if (callGraph.deletedEdgeIds && callGraph.deletedEdgeIds.length > 0) {
    const deletedSet = new Set(callGraph.deletedEdgeIds);
    edges = edges.filter(e => !deletedSet.has(e.id));
  }

  // Add user edges
  if (callGraph.userEdges && callGraph.userEdges.length > 0) {
    for (const userEdge of callGraph.userEdges) {
      const sourcePos = nodePositions.get(userEdge.from);
      const targetPos = nodePositions.get(userEdge.to);
      if (!sourcePos || !targetPos) continue;

      // Use stored handles if available, otherwise calculate from positions
      let sourceHandle = userEdge.sourceHandle;
      let targetHandle = userEdge.targetHandle;

      if (!sourceHandle || !targetHandle) {
        const dx = targetPos.x - sourcePos.x;
        const dy = targetPos.y - sourcePos.y;
        const direction = Math.abs(dx) > Math.abs(dy)
          ? (dx > 0 ? 'right' : 'left')
          : (dy > 0 ? 'bottom' : 'top');
        const oppositeDirection: Record<string, string> = {
          right: 'left', left: 'right', bottom: 'top', top: 'bottom'
        };
        sourceHandle = sourceHandle || `${direction}-source`;
        targetHandle = targetHandle || `${oppositeDirection[direction]}-target`;
      }

      const styles: Record<string, { stroke: string; dash?: string }> = {
        inherits: { stroke: '#60a5fa' },
        implements: { stroke: '#818cf8' },
        uses: { stroke: '#fbbf24', dash: '5,5' },
        delegatecall: { stroke: '#f472b6', dash: '8,4' },
        registers: { stroke: '#a78bfa', dash: '3,3' },
        imports: { stroke: '#94a3b8', dash: '2,2' },
      };

      const s = styles[userEdge.type] || styles.uses;

      edges.push({
        id: userEdge.id,
        source: userEdge.from,
        target: userEdge.to,
        type: 'dependencyEdge',
        sourceHandle,
        targetHandle,
        zIndex: 1000,
        data: {
          type: userEdge.type,
          isUserEdge: true,
        },
        style: {
          stroke: s.stroke,
          strokeWidth: 2,
          strokeDasharray: s.dash,
          opacity: 0.8,
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: s.stroke },
      });
    }
  }

  return { nodes, edges };
}
