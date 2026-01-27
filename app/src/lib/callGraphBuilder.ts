import type {
  CallGraph,
  Contract,
  Dependency,
  DependencyType,
  DirectoryNode,
  Stats,
  ProxyGroup,
  ProxyPatternType,
  ProxyRole,
} from '@/types/callGraph';

// Find common directory prefix across all file paths
function findCommonPrefix(paths: string[]): string {
  if (paths.length === 0) return '';
  if (paths.length === 1) {
    const parts = paths[0].split('/').filter((p) => p);
    // Return directory part only (exclude the file name)
    return parts.length > 1 ? parts.slice(0, -1).join('/') : '';
  }

  const splitPaths = paths.map((p) => p.split('/').filter((part) => part));
  const minLength = Math.min(...splitPaths.map((p) => p.length));

  const commonParts: string[] = [];
  for (let i = 0; i < minLength - 1; i++) {
    // -1 to exclude file names
    const part = splitPaths[0][i];
    if (splitPaths.every((p) => p[i] === part)) {
      commonParts.push(part);
    } else {
      break;
    }
  }

  return commonParts.join('/');
}

// Build directory structure from file paths
function buildDirectoryStructure(contracts: Contract[]): DirectoryNode {
  // Find common prefix to strip (the uploaded directory name)
  const filePaths = contracts.map((c) => c.filePath);
  const commonPrefix = findCommonPrefix(filePaths);
  const prefixParts = commonPrefix ? commonPrefix.split('/').filter((p) => p) : [];
  const prefixLength = prefixParts.length;

  // Use the last part of the common prefix as root name, or 'contracts' as fallback
  const rootName = prefixParts.length > 0 ? prefixParts[prefixParts.length - 1] : 'contracts';

  const root: DirectoryNode = {
    name: rootName,
    type: 'directory',
    path: rootName,
    children: [],
  };

  for (const contract of contracts) {
    const allParts = contract.filePath.split('/').filter((p) => p);
    // Skip the common prefix parts
    const parts = allParts.slice(prefixLength);

    if (parts.length === 0) continue;

    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const currentPath = [rootName, ...parts.slice(0, i + 1)].join('/');

      if (!current.children) {
        current.children = [];
      }

      let child = current.children.find((c) => c.name === part);

      if (!child) {
        child = {
          name: part,
          type: isFile ? 'file' : 'directory',
          path: currentPath,
          children: isFile ? undefined : [],
          contractName: isFile ? contract.name : undefined,
        };
        current.children.push(child);
      }

      if (!isFile) {
        current = child;
      }
    }
  }

  return root;
}

// Detect proxy pattern for a contract
function detectProxyPattern(contract: Contract): {
  pattern?: ProxyPatternType;
  role?: ProxyRole;
} {
  const functionNames = [
    ...contract.externalFunctions.map((f) => f.name),
    ...contract.internalFunctions.map((f) => f.name),
  ];
  const eventNames = contract.events.map((e) => e.name);
  const lowerName = contract.name.toLowerCase();
  // Normalize path separators and check for /functions/ pattern
  const lowerPath = contract.filePath.toLowerCase().replace(/\\/g, '/');
  const inheritNames = contract.inherits.map((i) => i.toLowerCase());

  // EIP-7546 Detection (Meta Contract / Borderless)
  // Dictionary pattern - check first since Dictionary.sol is in /functions/
  if (
    lowerName.includes('dictionary') ||
    lowerName === 'dictionarycore' ||
    lowerPath.includes('/dictionary/') ||
    eventNames.includes('DictionaryUpgraded') ||
    eventNames.includes('ImplementationSet') ||
    functionNames.includes('setImplementation') ||
    functionNames.includes('bulkSetImplementation')
  ) {
    return { pattern: 'eip7546', role: 'dictionary' };
  }

  // EIP-7546 Proxy pattern
  if (
    functionNames.includes('getDictionary') ||
    lowerName === 'borderlessproxy' ||
    lowerName.includes('borderlessproxy') ||
    inheritNames.some((i) => i.includes('borderlessproxy') || i === 'proxy') ||
    (lowerPath.includes('/proxy/') && lowerPath.includes('/functions/'))
  ) {
    return { pattern: 'eip7546', role: 'proxy' };
  }

  // Check if this is in /functions/ directory (implementation)
  // Use regex to match /functions/ more reliably
  const functionsPattern = /[/\\]functions[/\\]/i;
  const hasFunctionsDir = functionsPattern.test(contract.filePath);

  // Debug log
  console.log(`[ERC7546 Check] ${contract.name}:`);
  console.log(`  filePath: ${contract.filePath}`);
  console.log(`  hasFunctionsDir: ${hasFunctionsDir}`);
  console.log(`  isLib: ${lowerName.includes('lib')}`);

  if (hasFunctionsDir && !lowerName.includes('lib')) {
    console.log(`  -> Detected as ERC7546 implementation`);
    return { pattern: 'eip7546', role: 'implementation' };
  }

  // UUPS Detection
  if (
    functionNames.includes('upgradeTo') ||
    functionNames.includes('upgradeToAndCall') ||
    inheritNames.some((i) => i.includes('uups'))
  ) {
    // Check if it's the implementation or the proxy
    if (functionNames.includes('proxiableUUID') || functionNames.includes('_authorizeUpgrade')) {
      return { pattern: 'uups', role: 'implementation' };
    }
    return { pattern: 'uups', role: 'proxy' };
  }

  // Diamond Detection (EIP-2535)
  if (
    functionNames.includes('diamondCut') ||
    functionNames.includes('facets') ||
    functionNames.includes('facetAddress') ||
    eventNames.includes('DiamondCut')
  ) {
    return { pattern: 'diamond', role: 'proxy' };
  }

  // Beacon Detection
  if (
    functionNames.includes('implementation') &&
    (lowerName.includes('beacon') || inheritNames.some((i) => i.includes('beacon')))
  ) {
    return { pattern: 'beacon', role: 'beacon' };
  }

  if (inheritNames.some((i) => i.includes('beaconproxy'))) {
    return { pattern: 'beacon', role: 'proxy' };
  }

  // Transparent Proxy Detection
  if (
    inheritNames.some((i) => i.includes('transparentupgradeableproxy')) ||
    (lowerName.includes('proxy') && functionNames.includes('admin'))
  ) {
    return { pattern: 'transparent', role: 'proxy' };
  }

  return {};
}

// Extract module/feature name from file path
// e.g., "sc/ERC721/functions/ERC721.sol" -> "ERC721"
// e.g., "sc/Services/Token/LETS/functions/LETS.sol" -> "LETS"
function extractModuleName(filePath: string): string | null {
  const parts = filePath.split('/');

  // Find /functions/ directory and get the parent
  const funcIndex = parts.findIndex((p) => p.toLowerCase() === 'functions');
  if (funcIndex > 0) {
    return parts[funcIndex - 1];
  }

  // Find /libs/ directory and get the parent
  const libIndex = parts.findIndex((p) => p.toLowerCase() === 'libs');
  if (libIndex > 0) {
    return parts[libIndex - 1];
  }

  // Find /interfaces/ directory and get the parent
  const ifaceIndex = parts.findIndex((p) => p.toLowerCase() === 'interfaces');
  if (ifaceIndex > 0) {
    return parts[ifaceIndex - 1];
  }

  // Find /storages/ directory and get the parent
  const storageIndex = parts.findIndex((p) => p.toLowerCase() === 'storages');
  if (storageIndex > 0) {
    return parts[storageIndex - 1];
  }

  return null;
}

// Get the base directory for a module
// e.g., "sc/ERC721/functions/ERC721.sol" -> "sc/ERC721"
function getModuleBaseDir(filePath: string): string | null {
  const parts = filePath.split('/');

  // Find special directories
  const specialDirs = ['functions', 'libs', 'interfaces', 'storages', 'tests'];
  for (const special of specialDirs) {
    const idx = parts.findIndex((p) => p.toLowerCase() === special);
    if (idx > 0) {
      return parts.slice(0, idx).join('/');
    }
  }

  return null;
}

// Detect and group proxy patterns
function detectProxyGroups(contracts: Contract[]): ProxyGroup[] {
  const groups: ProxyGroup[] = [];
  const contractMap = new Map<string, Contract>();
  const contractsByModule = new Map<string, Contract[]>();

  for (const contract of contracts) {
    contractMap.set(contract.name, contract);

    // Group by module
    const moduleName = extractModuleName(contract.filePath);
    if (moduleName) {
      if (!contractsByModule.has(moduleName)) {
        contractsByModule.set(moduleName, []);
      }
      contractsByModule.get(moduleName)!.push(contract);
    }
  }

  // First pass: detect patterns and roles
  for (const contract of contracts) {
    const { pattern, role } = detectProxyPattern(contract);
    if (pattern) {
      contract.proxyPattern = pattern;
      contract.proxyRole = role;
    }
  }

  // Second pass: Enhanced EIP-7546 grouping
  // Find core infrastructure (Dictionary, Proxy)
  const dictionaries = contracts.filter((c) => c.proxyRole === 'dictionary');
  const proxies = contracts.filter((c) => c.proxyRole === 'proxy' && c.proxyPattern === 'eip7546');

  // Group implementations by module base directory
  const moduleGroups = new Map<string, {
    baseDir: string;
    moduleName: string;
    implementations: Contract[];
    libs: Contract[];
    interfaces: Contract[];
    storages: Contract[];
  }>();

  for (const contract of contracts) {
    if (contract.proxyPattern === 'eip7546' && contract.proxyRole === 'implementation') {
      const baseDir = getModuleBaseDir(contract.filePath);
      const moduleName = extractModuleName(contract.filePath);

      if (baseDir && moduleName) {
        if (!moduleGroups.has(baseDir)) {
          moduleGroups.set(baseDir, {
            baseDir,
            moduleName,
            implementations: [],
            libs: [],
            interfaces: [],
            storages: [],
          });
        }
        moduleGroups.get(baseDir)!.implementations.push(contract);
      }
    }
  }

  // Add related contracts (libs, interfaces, storages) to each module group
  for (const contract of contracts) {
    const baseDir = getModuleBaseDir(contract.filePath);
    if (baseDir && moduleGroups.has(baseDir)) {
      const group = moduleGroups.get(baseDir)!;
      const lowerPath = contract.filePath.toLowerCase();

      if (lowerPath.includes('/libs/') && contract.kind === 'library') {
        group.libs.push(contract);
        // Mark library as part of EIP-7546
        contract.proxyPattern = 'eip7546';
        contract.proxyRole = 'implementation'; // Libraries are part of implementation
      } else if (lowerPath.includes('/storages/')) {
        group.storages.push(contract);
      } else if (lowerPath.includes('/interfaces/')) {
        group.interfaces.push(contract);
      }
    }
  }

  // Create proxy groups
  let groupId = 0;

  // Create a single core group for Dictionary and Proxy
  if (dictionaries.length > 0 || proxies.length > 0) {
    const coreId = `proxy-group-core`;
    const coreGroup: ProxyGroup = {
      id: coreId,
      name: 'ERC7546 Core',
      patternType: 'eip7546',
      dictionary: dictionaries[0]?.name,
      proxy: proxies[0]?.name,
      implementations: [],
    };

    // Assign group ID to core contracts
    for (const dict of dictionaries) {
      dict.proxyGroupId = coreId;
    }
    for (const proxy of proxies) {
      proxy.proxyGroupId = coreId;
    }

    groups.push(coreGroup);
  }

  // Create groups for each module
  for (const [baseDir, moduleData] of moduleGroups) {
    if (moduleData.implementations.length > 0) {
      const id = `proxy-group-${groupId++}`;

      const allImplementations = [
        ...moduleData.implementations,
        ...moduleData.libs,
      ];

      const group: ProxyGroup = {
        id,
        name: moduleData.moduleName,
        patternType: 'eip7546',
        dictionary: dictionaries[0]?.name, // Reference to core dictionary
        proxy: proxies[0]?.name, // Reference to core proxy
        implementations: allImplementations.map((c) => c.name),
      };

      // Update contracts with group ID
      for (const contract of allImplementations) {
        contract.proxyGroupId = id;
      }

      // Also mark storages (optional)
      for (const storage of moduleData.storages) {
        storage.proxyGroupId = id;
      }

      groups.push(group);
    }
  }

  // Handle other proxy patterns (UUPS, Diamond, Beacon, Transparent)
  const otherPatterns = contracts.filter(
    (c) => c.proxyPattern && c.proxyPattern !== 'eip7546' && !c.proxyGroupId
  );

  for (const contract of otherPatterns) {
    if (contract.proxyRole === 'proxy') {
      const id = `proxy-group-${groupId++}`;
      const implementations = contracts
        .filter(
          (c) =>
            c.proxyPattern === contract.proxyPattern &&
            c.proxyRole === 'implementation'
        )
        .map((c) => c.name);

      const group: ProxyGroup = {
        id,
        name: contract.name,
        patternType: contract.proxyPattern!,
        proxy: contract.name,
        implementations,
      };

      contract.proxyGroupId = id;
      for (const impl of implementations) {
        const implContract = contractMap.get(impl);
        if (implContract) {
          implContract.proxyGroupId = id;
        }
      }

      groups.push(group);
    }
  }

  return groups;
}

// Resolve a relative import path to an absolute path
function resolveRelativePath(basePath: string, relativePath: string): string {
  const baseDir = basePath.split('/').slice(0, -1);
  const parts = relativePath.split('/');

  for (const part of parts) {
    if (part === '..') {
      baseDir.pop();
    } else if (part !== '.' && part !== '') {
      baseDir.push(part);
    }
  }

  return baseDir.join('/');
}

// Find a contract by name, using import info for path-based resolution
function findContractByImport(
  contracts: Contract[],
  name: string,
  sourceContract: Contract
): Contract | undefined {
  // First, try to find by import path (most accurate)
  const importInfo = sourceContract.imports.find(
    (imp) => imp.name === name || imp.alias === name
  );

  if (importInfo) {
    let targetPath: string;
    if (importInfo.isExternal) {
      targetPath = importInfo.path;
    } else {
      targetPath = resolveRelativePath(sourceContract.filePath, importInfo.path);
    }

    const byPath = contracts.find(
      (c) =>
        c.filePath === targetPath ||
        c.filePath.endsWith(targetPath) ||
        targetPath.endsWith(c.filePath)
    );
    if (byPath) return byPath;
  }

  // Fallback to name-based search
  return contracts.find((c) => c.name === name);
}

// Detect dependencies between contracts
function detectDependencies(contracts: Contract[]): Dependency[] {
  const dependencies: Dependency[] = [];
  const addedDeps = new Set<string>(); // Prevent duplicates

  const addDependency = (from: string, to: string, type: DependencyType, functions?: string[]) => {
    // Prevent self-referencing edges
    if (from === to) return;

    const key = `${from}->${to}:${type}`;
    if (!addedDeps.has(key)) {
      addedDeps.add(key);
      dependencies.push({ from, to, type, functions });
    }
  };

  for (const contract of contracts) {
    // Inheritance dependencies - use import info for accurate resolution
    for (const parentName of contract.inherits) {
      const parentContract = findContractByImport(contracts, parentName, contract);
      if (parentContract) {
        addDependency(contract.name, parentContract.name, 'inherits');
      }
    }

    // Interface implementation - use import info for accurate resolution
    for (const ifaceName of contract.implements) {
      const ifaceContract = findContractByImport(contracts, ifaceName, contract);
      if (ifaceContract) {
        addDependency(contract.name, ifaceContract.name, 'implements');
      }
    }

    // Library usage - use import info for accurate resolution
    for (const libName of contract.usesLibraries) {
      const libContract = findContractByImport(contracts, libName, contract);
      if (libContract) {
        // Find which functions are used
        const usedFunctions: string[] = [];

        for (const func of [...contract.externalFunctions, ...contract.internalFunctions]) {
          for (const call of func.calls) {
            if (call.type === 'library') {
              const [callLibName, funcName] = call.target.includes('.')
                ? call.target.split('.')
                : ['', call.target];
              // Check if this call is to the library (by name or alias)
              const callImport = contract.imports.find(
                (imp) => (imp.alias || imp.name) === callLibName
              );
              const actualLibName = callImport?.name || callLibName;
              if (actualLibName === libName && funcName && !usedFunctions.includes(funcName)) {
                usedFunctions.push(funcName);
              }
            }
          }
        }

        addDependency(contract.name, libContract.name, 'uses', usedFunctions.length > 0 ? usedFunctions : undefined);
      }
    }

    // Detect delegatecall from function calls
    for (const func of [...contract.externalFunctions, ...contract.internalFunctions]) {
      for (const call of func.calls) {
        if (call.type === 'delegatecall' && call.target !== 'unknown' && call.target !== 'encoded_call') {
          // Try to find the target contract
          const targetContract = findContractByImport(contracts, call.target, contract);
          if (targetContract) {
            addDependency(contract.name, targetContract.name, 'delegatecall');
          }
        }
      }
    }

    // Delegatecall dependencies (for proxy patterns based on proxyGroupId)
    if (contract.proxyRole === 'proxy' || contract.proxyRole === 'dictionary') {
      const implementations = contracts.filter(
        (c) => c.proxyGroupId === contract.proxyGroupId && c.proxyRole === 'implementation'
      );

      for (const impl of implementations) {
        addDependency(
          contract.name,
          impl.name,
          contract.proxyRole === 'dictionary' ? 'registers' : 'delegatecall'
        );
      }
    }

    // ERC7546: Proxy -> Dictionary relationship
    if (contract.proxyPattern === 'eip7546' && contract.proxyRole === 'proxy') {
      const dictionaries = contracts.filter(
        (c) => c.proxyPattern === 'eip7546' && c.proxyRole === 'dictionary'
      );
      for (const dict of dictionaries) {
        addDependency(contract.name, dict.name, 'uses');
      }
    }
  }

  return dependencies;
}

// Calculate statistics
function calculateStats(contracts: Contract[]): Stats {
  return {
    totalContracts: contracts.filter((c) => c.kind === 'contract' || c.kind === 'abstract').length,
    totalLibraries: contracts.filter((c) => c.kind === 'library').length,
    totalInterfaces: contracts.filter((c) => c.kind === 'interface').length,
    totalFunctions: contracts.reduce(
      (sum, c) => sum + c.externalFunctions.length + c.internalFunctions.length,
      0
    ),
  };
}

// Resolve inherited functions for all contracts
function resolveInheritedFunctions(contracts: Contract[]): void {
  // Build contract map for quick lookup
  const contractMap = new Map<string, Contract>();
  for (const contract of contracts) {
    contractMap.set(contract.name, contract);
  }

  // Get all inherited functions for a contract (recursive)
  function getInheritedFunctions(
    contract: Contract,
    visited: Set<string>
  ): { external: typeof contract.externalFunctions; internal: typeof contract.internalFunctions } {
    const external: typeof contract.externalFunctions = [];
    const internal: typeof contract.internalFunctions = [];

    // Prevent circular inheritance
    if (visited.has(contract.name)) {
      return { external, internal };
    }
    visited.add(contract.name);

    // Process all parent contracts
    for (const parentName of contract.inherits) {
      const parent = contractMap.get(parentName);
      if (!parent) continue;

      // Get parent's own functions (mark as inherited)
      for (const func of parent.externalFunctions) {
        if (!func.inheritedFrom) {
          external.push({ ...func, inheritedFrom: parentName });
        } else {
          external.push(func);
        }
      }
      for (const func of parent.internalFunctions) {
        if (!func.inheritedFrom) {
          internal.push({ ...func, inheritedFrom: parentName });
        } else {
          internal.push(func);
        }
      }

      // Recursively get grandparent functions
      const grandparentFuncs = getInheritedFunctions(parent, visited);
      external.push(...grandparentFuncs.external);
      internal.push(...grandparentFuncs.internal);
    }

    // Also check implements (interfaces)
    for (const ifaceName of contract.implements) {
      const iface = contractMap.get(ifaceName);
      if (!iface) continue;

      for (const func of iface.externalFunctions) {
        if (!func.inheritedFrom) {
          external.push({ ...func, inheritedFrom: ifaceName });
        }
      }
    }

    return { external, internal };
  }

  // Resolve for each contract
  for (const contract of contracts) {
    // Skip interfaces and libraries
    if (contract.kind === 'interface' || contract.kind === 'library') continue;

    const visited = new Set<string>();
    const inherited = getInheritedFunctions(contract, visited);

    // Deduplicate by function name (keep the most derived version)
    const ownExternalNames = new Set(contract.externalFunctions.map(f => f.name));
    const ownInternalNames = new Set(contract.internalFunctions.map(f => f.name));

    // Add inherited functions that aren't overridden
    for (const func of inherited.external) {
      if (!ownExternalNames.has(func.name)) {
        contract.externalFunctions.push(func);
        ownExternalNames.add(func.name);
      }
    }
    for (const func of inherited.internal) {
      if (!ownInternalNames.has(func.name)) {
        contract.internalFunctions.push(func);
        ownInternalNames.add(func.name);
      }
    }
  }
}

// Build complete CallGraph from contracts
export function buildCallGraph(
  projectName: string,
  contracts: Contract[]
): CallGraph {
  // Detect proxy groups first (this also sets proxyPattern, proxyRole, proxyGroupId)
  const proxyGroups = detectProxyGroups(contracts);

  // Resolve inherited functions
  resolveInheritedFunctions(contracts);

  return {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    projectName,
    structure: buildDirectoryStructure(contracts),
    contracts,
    dependencies: detectDependencies(contracts),
    proxyGroups,
    stats: calculateStats(contracts),
  };
}
