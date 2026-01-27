import type { Node, Edge } from 'reactflow';
import { MarkerType } from 'reactflow';
import dagre from 'dagre';
import type { CallGraph, Contract, Dependency, ContractCategory, ProxyGroup, ProxyPatternType } from '@/types/callGraph';

export type LayoutMode = 'grid' | 'hierarchy';

export interface ContractNodeData {
  contract: Contract;
  isSelected: boolean;
  selectedFunction: string | null;
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

// Layout constants - must match ContractNode fixed size (280x200)
const NODE_WIDTH = 280;
const NODE_HEIGHT = 200;
const NODE_GAP_X = 60;
const NODE_GAP_Y = 50;
const CATEGORY_PADDING = 25;

// Category display order (OpenZeppelin structure)
const CATEGORY_ORDER: ContractCategory[] = [
  'token',
  'access',
  'governance',
  'proxy',
  'finance',
  'account',
  'metatx',
  'utils',
  'interface',
  'library',
  'other',
];

// Category labels
const CATEGORY_LABELS: Record<ContractCategory, string> = {
  access: 'Access Control',
  account: 'Account',
  finance: 'Finance',
  governance: 'Governance',
  metatx: 'Meta TX',
  proxy: 'Proxy',
  token: 'Token',
  utils: 'Utilities',
  interface: 'Interface',
  library: 'Library',
  other: 'Other',
};

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
  return CATEGORY_LABELS[category];
}

export interface TransformOptions {
  enableCategoryGroups?: boolean;
  visibleCategories?: ContractCategory[];
  layoutMode?: LayoutMode;  // 'grid' (default) or 'dagre'
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

  for (const category of CATEGORY_ORDER) {
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
        label: CATEGORY_LABELS[category],
        contracts: catContracts,
      });
    }
  }

  return groups;
}

/**
 * Calculate hierarchical positions for contracts within a group using dagre
 * Returns relative positions within the group
 */
function calculateHierarchicalPositions(
  contracts: Contract[],
  dependencies: Dependency[]
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  if (contracts.length === 0) return positions;
  if (contracts.length === 1) {
    positions.set(contracts[0].name, { x: 0, y: 0 });
    return positions;
  }

  const contractNames = new Set(contracts.map(c => c.name));

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

  // Add nodes
  for (const contract of contracts) {
    g.setNode(contract.name, { width: NODE_WIDTH, height: NODE_HEIGHT });
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
      minX = Math.min(minX, node.x - NODE_WIDTH / 2);
      minY = Math.min(minY, node.y - NODE_HEIGHT / 2);
    }
  }

  for (const contract of contracts) {
    const node = g.node(contract.name);
    if (node) {
      const x = Math.round(node.x - NODE_WIDTH / 2 - minX);
      const y = Math.round(node.y - NODE_HEIGHT / 2 - minY);
      positions.set(contract.name, { x, y });
    }
  }

  return positions;
}

/**
 * Calculate group dimensions based on hierarchical positions
 */
function calculateHierarchicalGroupDimensions(
  positions: Map<string, { x: number; y: number }>
): { width: number; height: number } {
  let maxX = 0, maxY = 0;

  for (const pos of positions.values()) {
    maxX = Math.max(maxX, pos.x + NODE_WIDTH);
    maxY = Math.max(maxY, pos.y + NODE_HEIGHT);
  }

  return {
    width: maxX + CATEGORY_PADDING * 2,
    height: maxY + CATEGORY_PADDING * 2,
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

  // Track handle usage for offset calculation (to prevent overlapping lines)
  // Key: "nodeName-direction" (e.g., "Proxy-bottom"), Value: count of edges using that handle
  const sourceHandleUsage = new Map<string, number>();
  const targetHandleUsage = new Map<string, number>();
  const OFFSET_STEP = 15; // Pixels between parallel lines

  // Helper to get offset for a handle
  const getSourceOffset = (nodeName: string, direction: string): number => {
    const key = `${nodeName}-${direction}`;
    const count = sourceHandleUsage.get(key) || 0;
    sourceHandleUsage.set(key, count + 1);
    // Center the offsets around 0: -30, -15, 0, 15, 30, ...
    const offset = (count - Math.floor(count / 2)) * OFFSET_STEP * (count % 2 === 0 ? 1 : -1);
    return count === 0 ? 0 : offset;
  };

  const getTargetOffset = (nodeName: string, direction: string): number => {
    const key = `${nodeName}-${direction}`;
    const count = targetHandleUsage.get(key) || 0;
    targetHandleUsage.set(key, count + 1);
    const offset = (count - Math.floor(count / 2)) * OFFSET_STEP * (count % 2 === 0 ? 1 : -1);
    return count === 0 ? 0 : offset;
  };

  for (const dep of dependencies) {
    // Skip self-referencing edges
    if (dep.from === dep.to) continue;

    const sourcePos = nodePositions.get(dep.from);
    const targetPos = nodePositions.get(dep.to);
    if (!sourcePos || !targetPos) continue;

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
    const isErc7546Edge = sourceGroup?.startsWith('erc7546-') && targetGroup?.startsWith('erc7546-');

    // For ERC7546 group, only show key relationship edges (not inheritance to reduce clutter)
    if (isErc7546Edge) {
      // Only show delegatecall, registers, uses - skip inherits/implements to avoid duplicate lines
      if (dep.type === 'delegatecall' || dep.type === 'registers' || dep.type === 'uses') {
        // Only create one edge per node pair within ERC7546
        const pairKey = `${dep.from}-${dep.to}`;
        if (!createdEdgePairs.has(pairKey)) {
          const sourceOffset = getSourceOffset(dep.from, direction);
          const targetOffset = getTargetOffset(dep.to, oppositeDir[direction]);
          const edge = createSingleEdge(dep, sourcePos, targetPos, false, 0.6, sourceOffset, targetOffset);
          if (edge) {
            edges.push(edge);
            createdEdgePairs.add(pairKey);
          }
        }
      }
      // Skip all other edge types within ERC7546 group
      continue;
    }

    // For inheritance/implements, show within same category or base
    if (dep.type === 'inherits' || dep.type === 'implements') {
      const involvesBase = sourceGroup === 'base' || targetGroup === 'base';
      if ((sourceCategory && targetCategory && sourceCategory === targetCategory) || involvesBase) {
        const sourceOffset = getSourceOffset(dep.from, direction);
        const targetOffset = getTargetOffset(dep.to, oppositeDir[direction]);
        const edge = createSingleEdge(dep, sourcePos, targetPos, false, 0.4, sourceOffset, targetOffset);
        if (edge) edges.push(edge);
        continue;
      }
    }

    // Different categories: hide by default
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

  const opacity = customOpacity ?? (isSelected ? 1 : 0.3);
  const strokeWidth = isSelected ? 2.5 : 1.2;

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

/**
 * Find all contracts that are dependencies of ERC7546 contracts
 * (inherited, used, or implemented by ERC7546 contracts)
 */
function findErc7546Dependencies(
  contracts: Contract[],
  dependencies: Dependency[]
): Set<string> {
  const erc7546Names = new Set(
    contracts.filter(c => c.proxyPattern === 'eip7546').map(c => c.name)
  );
  const dependencyNames = new Set<string>();

  // Find contracts that ERC7546 contracts depend on
  for (const dep of dependencies) {
    if (erc7546Names.has(dep.from)) {
      // dep.from (ERC7546 contract) depends on dep.to
      if (dep.type === 'inherits' || dep.type === 'implements' || dep.type === 'uses') {
        dependencyNames.add(dep.to);
      }
    }
  }

  return dependencyNames;
}

export function transformToReactFlow(
  callGraph: CallGraph,
  selectedContract: string | null,
  selectedFunction: string | null,
  options: TransformOptions = {}
): { nodes: Node[]; edges: Edge[] } {
  const { visibleCategories, layoutMode = 'grid' } = options;
  const nodes: Node[] = [];
  const nodePositions = new Map<string, NodePosition>();
  const categoryBoundsMap = new Map<ContractCategory, CategoryBounds>();
  const contractCategories = new Map<string, ContractCategory>();
  const contractGroups = new Map<string, string>();  // contract name -> group id

  // Filter contracts
  let contracts = callGraph.contracts.filter(c => c.kind === 'contract' || c.kind === 'abstract');
  if (visibleCategories) {
    contracts = contracts.filter(c => visibleCategories.includes(c.category));
  }

  if (contracts.length === 0) {
    return { nodes: [], edges: [] };
  }

  // Build category map
  for (const c of contracts) {
    contractCategories.set(c.name, c.category);
  }

  // === STEP 0: Identify ERC7546 contracts and their dependencies ===
  const erc7546Dependencies = findErc7546Dependencies(contracts, callGraph.dependencies);
  const isErc7546Related = (c: Contract) =>
    c.proxyPattern === 'eip7546' || erc7546Dependencies.has(c.name);

  const erc7546RelatedContracts = contracts.filter(isErc7546Related);
  const nonErc7546Contracts = contracts.filter(c => !isErc7546Related(c));

  // Layout constants
  const startX = 80;
  let currentY = 80;
  const COLUMN_GAP = 40;
  const SUB_CATEGORY_GAP = 30;
  const CONTRACTS_PER_ROW = 2;
  const PROXY_GROUP_PADDING = 50;
  const ERC7546_INNER_GAP = 30;
  const ERC7546_SECTION_GAP = 60;

  interface GroupPosition {
    group: GroupInfo;
    x: number;
    y: number;
    width: number;
    height: number;
  }

  // === STEP 1: Layout ERC7546 related contracts ===
  if (erc7546RelatedContracts.length > 0) {
    // Group by role:
    // - Proxy: proxyRole='proxy' OR category='proxy'
    // - Dictionary: proxyRole='dictionary'
    // - Implementation: others (excluding category='proxy')
    const proxyRoleContracts = erc7546RelatedContracts.filter(
      c => c.proxyRole === 'proxy' || c.category === 'proxy'
    );
    const dictionaryRoleContracts = erc7546RelatedContracts.filter(
      c => c.proxyRole === 'dictionary' && c.category !== 'proxy'
    );
    const implementationContracts = erc7546RelatedContracts.filter(
      c => c.proxyRole !== 'proxy' && c.proxyRole !== 'dictionary' && c.category !== 'proxy'
    );

    // Sort within each group
    proxyRoleContracts.sort((a, b) => a.name.localeCompare(b.name));
    dictionaryRoleContracts.sort((a, b) => a.name.localeCompare(b.name));

    // Group implementations by their original category
    const implByCategory = new Map<ContractCategory, Contract[]>();
    for (const c of implementationContracts) {
      const list = implByCategory.get(c.category) || [];
      list.push(c);
      implByCategory.set(c.category, list);
    }
    for (const list of implByCategory.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Layout interface
    interface Erc7546CategoryLayout {
      label: string;
      category: ContractCategory | 'proxy-role' | 'dictionary-role';
      contracts: Contract[];
      x: number;
      y: number;
      width: number;
      height: number;
    }
    const erc7546CategoryLayouts: Erc7546CategoryLayout[] = [];

    // Calculate dimensions helper
    const calcDimensions = (contracts: Contract[], maxCols: number) => {
      const cols = Math.min(contracts.length, maxCols);
      const rows = Math.ceil(contracts.length / maxCols);
      const width = cols * NODE_WIDTH + (cols - 1) * NODE_GAP_X + CATEGORY_PADDING * 2;
      const height = rows * NODE_HEIGHT + (rows - 1) * NODE_GAP_Y + CATEGORY_PADDING * 2;
      return { cols, rows, width, height };
    };

    let layoutY = 0;
    let maxWidth = 0;

    // 1. Proxy row (top)
    let proxyLayout: Erc7546CategoryLayout | null = null;
    if (proxyRoleContracts.length > 0) {
      const { width, height } = calcDimensions(proxyRoleContracts, 5);
      proxyLayout = {
        label: 'Proxy',
        category: 'proxy-role',
        contracts: proxyRoleContracts,
        x: 0,
        y: layoutY,
        width,
        height,
      };
      layoutY += height + ERC7546_INNER_GAP;
      maxWidth = Math.max(maxWidth, width);
    }

    // 2. Dictionary row (middle)
    let dictionaryLayout: Erc7546CategoryLayout | null = null;
    if (dictionaryRoleContracts.length > 0) {
      const { width, height } = calcDimensions(dictionaryRoleContracts, 5);
      dictionaryLayout = {
        label: 'Dictionary',
        category: 'dictionary-role',
        contracts: dictionaryRoleContracts,
        x: 0,
        y: layoutY,
        width,
        height,
      };
      layoutY += height + ERC7546_INNER_GAP;
      maxWidth = Math.max(maxWidth, width);
    }

    // 3. Implementation rows (bottom, horizontal by category)
    const implLayouts: Erc7546CategoryLayout[] = [];
    let implX = 0;
    let maxImplHeight = 0;

    const implCategories = Array.from(implByCategory.keys()).sort(
      (a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b)
    );

    for (const category of implCategories) {
      const catContracts = implByCategory.get(category)!;
      const { width, height } = calcDimensions(catContracts, CONTRACTS_PER_ROW);
      implLayouts.push({
        label: CATEGORY_LABELS[category],
        category,
        contracts: catContracts,
        x: implX,
        y: layoutY,
        width,
        height,
      });
      implX += width + COLUMN_GAP;
      maxImplHeight = Math.max(maxImplHeight, height);
    }

    const implTotalWidth = implX > 0 ? implX - COLUMN_GAP : 0;
    maxWidth = Math.max(maxWidth, implTotalWidth);
    const implTotalHeight = maxImplHeight;

    // Calculate total ERC7546 group dimensions
    const erc7546InnerHeight = layoutY + implTotalHeight;
    const erc7546GroupWidth = maxWidth + PROXY_GROUP_PADDING * 2;
    const erc7546GroupHeight = erc7546InnerHeight + PROXY_GROUP_PADDING * 2 + 30;  // +30 for header

    // Set positions relative to ERC7546 group
    const contentStartX = PROXY_GROUP_PADDING;
    const contentStartY = PROXY_GROUP_PADDING + 30;  // After header

    if (proxyLayout) {
      proxyLayout.x = contentStartX + proxyLayout.x;
      proxyLayout.y = contentStartY + proxyLayout.y;
      erc7546CategoryLayouts.push(proxyLayout);
    }

    if (dictionaryLayout) {
      dictionaryLayout.x = contentStartX + dictionaryLayout.x;
      dictionaryLayout.y = contentStartY + dictionaryLayout.y;
      erc7546CategoryLayouts.push(dictionaryLayout);
    }

    for (const layout of implLayouts) {
      layout.x = contentStartX + layout.x;
      layout.y = contentStartY + layout.y;
      erc7546CategoryLayouts.push(layout);
    }

    // Create ERC7546 group node (background)
    const erc7546GroupId = 'proxy-pattern-eip7546';
    nodes.push({
      id: erc7546GroupId,
      type: 'proxyPatternGroupNode',
      position: { x: startX, y: currentY },
      data: {
        patternType: 'eip7546',
        label: 'ERC-7546',
        contractCount: erc7546RelatedContracts.length,
      } as ProxyPatternGroupNodeData,
      style: {
        width: `${erc7546GroupWidth}px`,
        height: `${erc7546GroupHeight}px`,
      },
      selectable: false,
      draggable: true,
      zIndex: -1,
    });

    // Create category group nodes inside ERC7546
    for (const layout of erc7546CategoryLayouts) {
      const groupNodeId = `erc7546-category-${layout.category}`;
      const groupAbsX = startX + layout.x;
      const groupAbsY = currentY + layout.y;

      // Category group node
      nodes.push({
        id: groupNodeId,
        type: 'categoryGroupNode',
        position: { x: layout.x, y: layout.y },
        parentId: erc7546GroupId,
        extent: 'parent',
        data: {
          category: layout.category as ContractCategory,
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

      // Position contracts inside this category
      // Proxy and Dictionary use 5 cols, Implementation categories use 2 cols
      const maxCols = (layout.category === 'proxy-role' || layout.category === 'dictionary-role') ? 5 : CONTRACTS_PER_ROW;
      layout.contracts.forEach((contract, idx) => {
        const row = Math.floor(idx / maxCols);
        const col = idx % maxCols;
        const relativePosition = {
          x: CATEGORY_PADDING + col * (NODE_WIDTH + NODE_GAP_X),
          y: CATEGORY_PADDING + row * (NODE_HEIGHT + NODE_GAP_Y),
        };

        const absolutePosition = {
          x: groupAbsX + relativePosition.x,
          y: groupAbsY + relativePosition.y,
        };
        nodePositions.set(contract.name, absolutePosition);
        contractGroups.set(contract.name, groupNodeId);

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
          } as ContractNodeData,
          draggable: false,
        });
      });
    }

    currentY += erc7546GroupHeight + ERC7546_SECTION_GAP;
  }

  // === STEP 2: Handle non-ERC7546 contracts with category groups ===
  const groupPositions: GroupPosition[] = [];

  if (nonErc7546Contracts.length > 0) {
    // Analyze inheritance patterns
    const inheritanceInfo = analyzeInheritance(nonErc7546Contracts, callGraph.dependencies);

    // Identify base contracts
    const baseContracts = new Set<string>();
    for (const contract of nonErc7546Contracts) {
      if (isBaseContract(contract.name, inheritanceInfo)) {
        baseContracts.add(contract.name);
      }
    }

    // Separate base and category contracts
    const categoryContracts = nonErc7546Contracts.filter(c => !baseContracts.has(c.name));
    const baseContractList = nonErc7546Contracts.filter(c => baseContracts.has(c.name));

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
      for (const contract of baseContractList) {
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
          } as ContractNodeData,
          zIndex: 10,
        });

        baseX += NODE_WIDTH + NODE_GAP_X;
      }

      currentY += NODE_HEIGHT + 80;
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
        const positions = calculateHierarchicalPositions(group.contracts, callGraph.dependencies);
        groupHierarchyPositions.set(group.id, positions);
      }
    }

    // Position category columns
    let currentX = startX;
    for (const category of CATEGORY_ORDER) {
      const categoryGroups = categoryColumns.get(category);
      if (!categoryGroups || categoryGroups.length === 0) continue;

      let columnY = currentY;
      let maxColumnWidth = 0;

      for (const group of categoryGroups) {
        let width: number;
        let height: number;

        if (layoutMode === 'hierarchy') {
          const hierarchyPositions = groupHierarchyPositions.get(group.id);
          if (hierarchyPositions && hierarchyPositions.size > 0) {
            const dims = calculateHierarchicalGroupDimensions(hierarchyPositions);
            width = dims.width;
            height = dims.height;
          } else {
            const cols = Math.min(group.contracts.length, CONTRACTS_PER_ROW);
            const rows = Math.ceil(group.contracts.length / CONTRACTS_PER_ROW);
            width = cols * NODE_WIDTH + (cols - 1) * NODE_GAP_X + CATEGORY_PADDING * 2;
            height = rows * NODE_HEIGHT + (rows - 1) * NODE_GAP_Y + CATEGORY_PADDING * 2;
          }
        } else {
          const cols = Math.min(group.contracts.length, CONTRACTS_PER_ROW);
          const rows = Math.ceil(group.contracts.length / CONTRACTS_PER_ROW);
          width = cols * NODE_WIDTH + (cols - 1) * NODE_GAP_X + CATEGORY_PADDING * 2;
          height = rows * NODE_HEIGHT + (rows - 1) * NODE_GAP_Y + CATEGORY_PADDING * 2;
        }

        groupPositions.push({
          group,
          x: currentX + CATEGORY_PADDING,
          y: columnY + CATEGORY_PADDING,
          width,
          height,
        });

        maxColumnWidth = Math.max(maxColumnWidth, width);
        columnY += height + SUB_CATEGORY_GAP;
      }

      currentX += maxColumnWidth + COLUMN_GAP;
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

      group.contracts.forEach((contract, idx) => {
        let relativePosition: { x: number; y: number };

        if (layoutMode === 'hierarchy' && hierarchyPositions) {
          const hierPos = hierarchyPositions.get(contract.name);
          if (hierPos) {
            relativePosition = {
              x: CATEGORY_PADDING + hierPos.x,
              y: CATEGORY_PADDING + hierPos.y,
            };
          } else {
            const row = Math.floor(idx / CONTRACTS_PER_ROW);
            const col = idx % CONTRACTS_PER_ROW;
            relativePosition = {
              x: CATEGORY_PADDING + col * (NODE_WIDTH + NODE_GAP_X),
              y: CATEGORY_PADDING + row * (NODE_HEIGHT + NODE_GAP_Y),
            };
          }
        } else {
          const row = Math.floor(idx / CONTRACTS_PER_ROW);
          const col = idx % CONTRACTS_PER_ROW;
          relativePosition = {
            x: CATEGORY_PADDING + col * (NODE_WIDTH + NODE_GAP_X),
            y: CATEGORY_PADDING + row * (NODE_HEIGHT + NODE_GAP_Y),
          };
        }

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
          } as ContractNodeData,
          draggable: false,
        });
      });
    }
  }

  // Create edges
  const edges = createEdges(
    callGraph.dependencies,
    nodePositions,
    categoryBoundsMap,
    contractCategories,
    contractGroups,
    selectedContract
  );

  return { nodes, edges };
}
