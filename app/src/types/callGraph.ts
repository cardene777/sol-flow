/** Parameter */
export interface Parameter {
  name: string;
  type: string;
  indexed?: boolean;
}

/** Return Value */
export interface ReturnValue {
  name: string;
  type: string;
}

/** Error Definition */
export interface ErrorDefinition {
  name: string;
  parameters: Parameter[];
  startLine?: number;
}

/** Event Definition */
export interface EventDefinition {
  name: string;
  parameters: Parameter[];
  startLine?: number;
}

/** Struct Definition */
export interface StructDefinition {
  name: string;
  members: Parameter[];
  startLine?: number;
}

/** Contract Category - dynamically determined from directory structure */
export type ContractCategory = string;

/** Contract Kind */
export type ContractKind = 'contract' | 'library' | 'interface' | 'abstract';

/** Function Call */
export interface FunctionCall {
  target: string;
  type: 'internal' | 'library' | 'external' | 'modifier' | 'super' | 'delegatecall';
  /** The resolved type of the target variable (e.g., ITeleporterMessenger) */
  targetType?: string;
  /** Number of arguments in the call (used to match overloaded functions) */
  argCount?: number;
  condition?: string;
  sourceLocation?: {
    start: number;
    end: number;
  };
}

/** State Variable */
export interface StateVariable {
  name: string;
  type: string;
  visibility: 'public' | 'private' | 'internal';
  isConstant?: boolean;
  isImmutable?: boolean;
  startLine?: number;
}

/** External Function */
export interface ExternalFunction {
  name: string;
  signature: string;
  selector: string;
  visibility: 'external' | 'public';
  stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
  parameters: Parameter[];
  returnValues: ReturnValue[];
  calls: FunctionCall[];
  emits: string[];
  modifiers: string[];
  overrides?: string[];
  isVirtual: boolean;
  sourceCode?: string;
  startLine?: number;
  inheritedFrom?: string;  // Name of contract this function was inherited from
}

/** Internal Function */
export interface InternalFunction {
  name: string;
  visibility: 'internal' | 'private';
  stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
  parameters: Parameter[];
  returnValues: ReturnValue[];
  calls: FunctionCall[];
  emits: string[];
  isVirtual: boolean;
  sourceCode?: string;
  startLine?: number;
  inheritedFrom?: string;  // Name of contract this function was inherited from
}

/** Contract Proxy Role */
export type ProxyRole = 'proxy' | 'dictionary' | 'implementation' | 'beacon' | 'facet';

/** Import Information */
export interface ImportInfo {
  name: string;          // The imported name (e.g., "StorageSlot", "Storage")
  alias?: string;        // The alias if any (e.g., "Storage" imported as "ERC721Storage")
  path: string;          // The import path (e.g., "@openzeppelin/contracts/utils/StorageSlot.sol")
  isExternal: boolean;   // Whether it's an external dependency (starts with @)
}

/** Contract */
export interface Contract {
  name: string;
  kind: ContractKind;
  category: ContractCategory;
  filePath: string;
  inherits: string[];
  implements: string[];
  usesLibraries: string[];
  imports: ImportInfo[];
  externalFunctions: ExternalFunction[];
  internalFunctions: InternalFunction[];
  events: EventDefinition[];
  errors: ErrorDefinition[];
  structs?: StructDefinition[];
  /** State variables with their types (for resolving external calls) */
  stateVariables?: StateVariable[];
  // Proxy pattern detection
  proxyPattern?: ProxyPatternType;
  proxyRole?: ProxyRole;
  proxyGroupId?: string;
  // External library flag (OpenZeppelin, Solady, etc.)
  isExternalLibrary?: boolean;
  librarySource?: 'openzeppelin' | 'openzeppelin-upgradeable' | 'solady' | 'avalanche-icm';
}

/** Dependency Type */
export type DependencyType =
  | 'uses'
  | 'inherits'
  | 'implements'
  | 'imports'
  | 'delegatecall'
  | 'registers';  // Dictionary registers implementation

/** Dependency */
export interface Dependency {
  from: string;
  to: string;
  type: DependencyType;
  functions?: string[];
}

/** Proxy Pattern Type */
export type ProxyPatternType =
  | 'eip7546'      // Meta Contract / Borderless
  | 'uups'         // UUPS Upgradeable
  | 'transparent'  // Transparent Proxy
  | 'diamond'      // EIP-2535 Diamond
  | 'beacon';      // Beacon Proxy

/** Proxy Group - groups related proxy contracts */
export interface ProxyGroup {
  id: string;
  name: string;
  patternType: ProxyPatternType;
  proxy?: string;           // Proxy contract name
  dictionary?: string;      // Dictionary/Registry contract (EIP-7546)
  implementations: string[]; // Implementation/Function contracts
  beacon?: string;          // Beacon contract (if applicable)
}

/** Directory Node */
export interface DirectoryNode {
  name: string;
  type: 'directory' | 'file';
  path: string;
  children?: DirectoryNode[];
  contractName?: string;
}

/** Statistics */
export interface Stats {
  totalContracts: number;
  totalLibraries: number;
  totalInterfaces: number;
  totalFunctions: number;
}

/** User-added Edge */
export interface UserEdge {
  id: string;
  from: string;
  to: string;
  type: DependencyType;
  label?: string;
  sourceHandle?: string;
  targetHandle?: string;
  createdAt: string;
}

/** Call Graph */
export interface CallGraph {
  version: string;
  generatedAt: string;
  projectName: string;
  structure: DirectoryNode;
  contracts: Contract[];
  dependencies: Dependency[];
  proxyGroups: ProxyGroup[];
  stats: Stats;
  // User editing
  userEdges?: UserEdge[];
  deletedEdgeIds?: string[];
}
