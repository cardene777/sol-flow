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
}

/** Event Definition */
export interface EventDefinition {
  name: string;
  parameters: Parameter[];
}

/** Contract Category (aligned with OpenZeppelin directory structure) */
export type ContractCategory =
  | 'access'      // access control (Ownable, AccessControl, etc.)
  | 'account'     // account abstraction
  | 'finance'     // payment, vesting
  | 'governance'  // governor, timelock
  | 'metatx'      // meta transactions
  | 'proxy'       // proxy patterns
  | 'token'       // ERC20, ERC721, ERC1155
  | 'utils'       // utilities (Context, ReentrancyGuard, Pausable, etc.)
  | 'interface'   // interfaces
  | 'library'     // libraries
  | 'other';      // uncategorized

/** Contract Kind */
export type ContractKind = 'contract' | 'library' | 'interface' | 'abstract';

/** Function Call */
export interface FunctionCall {
  target: string;
  type: 'internal' | 'library' | 'external' | 'modifier' | 'super' | 'delegatecall';
  condition?: string;
  sourceLocation?: {
    start: number;
    end: number;
  };
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
  // Proxy pattern detection
  proxyPattern?: ProxyPatternType;
  proxyRole?: ProxyRole;
  proxyGroupId?: string;
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
}
