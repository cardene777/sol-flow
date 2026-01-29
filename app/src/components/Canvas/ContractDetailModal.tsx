'use client';

import { useState, useMemo } from 'react';
import { X, ChevronDown, ChevronRight, Variable, Zap, AlertTriangle, FunctionSquare, ExternalLink, Braces, FileCode, Copy, Check } from 'lucide-react';
import clsx from 'clsx';
import type { Contract, StateVariable, EventDefinition, ErrorDefinition, StructDefinition, ExternalFunction, InternalFunction, CallGraph } from '@/types/callGraph';
import { getGitHubUrlForPath, getGitHubUrlForLibrary, isExternalLibrary, LIBRARY_GITHUB_CONFIG } from '@/config/remappings';

interface ContractDetailModalProps {
  contract: Contract;
  libraryId?: string | null;
  allContracts?: Contract[];
  onClose: () => void;
}

// Extended types to track inheritance source
interface InheritedStateVariable extends StateVariable {
  inheritedFrom?: string;
}

interface InheritedEventDefinition extends EventDefinition {
  inheritedFrom?: string;
}

interface InheritedErrorDefinition extends ErrorDefinition {
  inheritedFrom?: string;
}

interface InheritedStructDefinition extends StructDefinition {
  inheritedFrom?: string;
}

// Helper to get GitHub URL for a contract
function getContractGitHubUrl(contract: Contract, libraryId?: string | null): string | null {
  if (!contract.filePath) return null;

  // Priority 1: If contract has librarySource (openzeppelin, solady, etc.), use that
  // This handles merged library contracts in user projects and samples
  if (contract.librarySource) {
    const config = LIBRARY_GITHUB_CONFIG[contract.librarySource];
    if (config) {
      const cleanPath = contract.filePath.startsWith('/') ? contract.filePath.slice(1) : contract.filePath;
      return `https://github.com/${config.repo}/blob/${config.branch}/${config.basePath}/${cleanPath}`;
    }
  }

  // Priority 2: If contract has isExternalLibrary flag with import path format
  if (contract.isExternalLibrary && isExternalLibrary(contract.filePath)) {
    return getGitHubUrlForPath(contract.filePath);
  }

  // Priority 3: Use libraryId for contracts in library view (Solady, OpenZeppelin library pages)
  if (libraryId) {
    return getGitHubUrlForLibrary(libraryId, contract.filePath);
  }

  // Priority 4: Check if filePath itself is an external library path
  if (isExternalLibrary(contract.filePath)) {
    return getGitHubUrlForPath(contract.filePath);
  }

  return null;
}

// Component for source link badge (shows contract name with GitHub link)
function InheritanceBadge({
  contractName,
  allContracts,
  libraryId,
  startLine,
  currentContract,
}: {
  contractName: string;
  allContracts: Contract[];
  libraryId?: string | null;
  startLine?: number;
  currentContract?: Contract; // Pass this when the element is from the current contract (not inherited)
}) {
  // Use currentContract if provided, otherwise search in allContracts
  const contract = currentContract || allContracts.find(c => c.name === contractName);
  let url = contract ? getContractGitHubUrl(contract, libraryId) : null;

  // Add line number if available
  if (url && startLine) {
    url = `${url}#L${startLine}`;
  }

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-mono hover:bg-purple-500/30 hover:text-purple-300 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {contractName}
        {startLine && <span className="text-purple-500">:{startLine}</span>}
        <ExternalLink className="w-3 h-3" />
      </a>
    );
  }

  return (
    <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-mono">
      {contractName}
    </span>
  );
}


// Helper to check if an import is a Storage or Schema
function isStorageOrSchemaImport(importPath: string): boolean {
  const lowerPath = importPath.toLowerCase();
  return lowerPath.includes('/storage') ||
         lowerPath.includes('/schema') ||
         lowerPath.includes('storage.sol') ||
         lowerPath.includes('schema.sol');
}

// Helper to collect inherited elements recursively
function collectInheritedElements(
  contract: Contract,
  allContracts: Contract[],
  visited: Set<string> = new Set()
): {
  stateVariables: InheritedStateVariable[];
  events: InheritedEventDefinition[];
  errors: InheritedErrorDefinition[];
  structs: InheritedStructDefinition[];
} {
  const result = {
    stateVariables: [] as InheritedStateVariable[],
    events: [] as InheritedEventDefinition[],
    errors: [] as InheritedErrorDefinition[],
    structs: [] as InheritedStructDefinition[],
  };

  // Add current contract's own elements (without inheritedFrom)
  for (const sv of contract.stateVariables || []) {
    result.stateVariables.push({ ...sv });
  }
  for (const ev of contract.events || []) {
    result.events.push({ ...ev });
  }
  for (const err of contract.errors || []) {
    result.errors.push({ ...err });
  }
  for (const st of contract.structs || []) {
    result.structs.push({ ...st });
  }

  // Process inherited contracts
  const inheritedNames = [...(contract.inherits || []), ...(contract.implements || [])];

  for (const inheritName of inheritedNames) {
    if (visited.has(inheritName)) continue;
    visited.add(inheritName);

    const inheritedContract = allContracts.find(c => c.name === inheritName);
    if (!inheritedContract) continue;

    // Recursively get inherited elements
    const inherited = collectInheritedElements(inheritedContract, allContracts, visited);

    // Add inherited state variables with source marker
    for (const sv of inherited.stateVariables) {
      if (!result.stateVariables.some(v => v.name === sv.name)) {
        result.stateVariables.push({ ...sv, inheritedFrom: sv.inheritedFrom || inheritName });
      }
    }

    // Add inherited events with source marker
    for (const ev of inherited.events) {
      if (!result.events.some(e => e.name === ev.name)) {
        result.events.push({ ...ev, inheritedFrom: ev.inheritedFrom || inheritName });
      }
    }

    // Add inherited errors with source marker
    for (const err of inherited.errors) {
      if (!result.errors.some(e => e.name === err.name)) {
        result.errors.push({ ...err, inheritedFrom: err.inheritedFrom || inheritName });
      }
    }

    // Add inherited structs with source marker
    for (const st of inherited.structs) {
      if (!result.structs.some(s => s.name === st.name)) {
        result.structs.push({ ...st, inheritedFrom: st.inheritedFrom || inheritName });
      }
    }
  }

  // Process imported Storage/Schema contracts
  for (const imp of contract.imports || []) {
    if (!isStorageOrSchemaImport(imp.path)) continue;

    // Find the imported contract by name or alias
    const importedName = imp.alias || imp.name;
    if (!importedName || visited.has(importedName)) continue;

    // Also try to find by extracting contract name from path
    const pathContractName = imp.path.split('/').pop()?.replace('.sol', '');

    const importedContract = allContracts.find(c =>
      c.name === importedName ||
      c.name === pathContractName ||
      c.name === imp.name
    );

    if (!importedContract) continue;
    visited.add(importedContract.name);

    const sourceName = imp.alias || importedContract.name;

    // Add state variables from Storage/Schema
    for (const sv of importedContract.stateVariables || []) {
      if (!result.stateVariables.some(v => v.name === sv.name)) {
        result.stateVariables.push({ ...sv, inheritedFrom: sourceName });
      }
    }

    // Add events from Storage/Schema
    for (const ev of importedContract.events || []) {
      if (!result.events.some(e => e.name === ev.name)) {
        result.events.push({ ...ev, inheritedFrom: sourceName });
      }
    }

    // Add errors from Storage/Schema
    for (const err of importedContract.errors || []) {
      if (!result.errors.some(e => e.name === err.name)) {
        result.errors.push({ ...err, inheritedFrom: sourceName });
      }
    }

    // Add structs from Storage/Schema
    for (const st of importedContract.structs || []) {
      if (!result.structs.some(s => s.name === st.name)) {
        result.structs.push({ ...st, inheritedFrom: sourceName });
      }
    }
  }

  return result;
}

type TabType = 'variables' | 'structs' | 'events' | 'errors' | 'functions' | 'source';

export function ContractDetailModal({ contract, libraryId, allContracts = [], onClose }: ContractDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('variables');

  // Collect all elements including inherited ones
  const { stateVariables, events, errors, structs } = useMemo(() => {
    if (allContracts.length === 0) {
      // Fallback if allContracts not provided
      return {
        stateVariables: (contract.stateVariables || []) as InheritedStateVariable[],
        events: (contract.events || []) as InheritedEventDefinition[],
        errors: (contract.errors || []) as InheritedErrorDefinition[],
        structs: (contract.structs || []) as InheritedStructDefinition[],
      };
    }
    return collectInheritedElements(contract, allContracts);
  }, [contract, allContracts]);

  const githubUrl = useMemo(() => {
    return getContractGitHubUrl(contract, libraryId);
  }, [contract, libraryId]);

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'variables', label: 'Variables', icon: <Variable className="w-4 h-4" />, count: stateVariables.length },
    { id: 'structs', label: 'Structs', icon: <Braces className="w-4 h-4" />, count: structs.length },
    { id: 'events', label: 'Events', icon: <Zap className="w-4 h-4" />, count: events.length },
    { id: 'errors', label: 'Errors', icon: <AlertTriangle className="w-4 h-4" />, count: errors.length },
    { id: 'functions', label: 'Functions', icon: <FunctionSquare className="w-4 h-4" />, count: (contract.externalFunctions?.length || 0) + (contract.internalFunctions?.length || 0) },
    { id: 'source', label: 'Source', icon: <FileCode className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-navy-900 border border-navy-600 rounded-xl shadow-2xl w-[98vw] h-[96vh] flex flex-col animate-fade-in-up">
        {/* GitHub Link Bar */}
        {githubUrl && (
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-2 bg-navy-800 border-b border-navy-600 text-sm text-slate-300 hover:text-mint transition-colors group"
          >
            <ExternalLink className="w-4 h-4 text-mint flex-shrink-0" />
            <span className="font-mono text-xs truncate group-hover:underline">{githubUrl}</span>
          </a>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-600 bg-navy-800/50">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-mint/20 text-mint rounded font-medium">
                {contract.kind}
              </span>
              <h2 className="font-mono font-semibold text-lg text-slate-100">
                {contract.name}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-mono truncate">
              {contract.filePath}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-navy-600 rounded-lg transition-colors text-slate-400 hover:text-slate-200 flex-shrink-0 ml-4"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-navy-600 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-[2px]',
                activeTab === tab.id
                  ? 'border-mint text-mint'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && (
                <span className="text-[10px] bg-navy-700 px-1.5 py-0.5 rounded">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'variables' && <VariablesTable variables={stateVariables} currentContract={contract} allContracts={allContracts} libraryId={libraryId} />}
          {activeTab === 'structs' && <StructsTable structs={structs} currentContract={contract} allContracts={allContracts} libraryId={libraryId} />}
          {activeTab === 'events' && <EventsTable events={events} currentContract={contract} allContracts={allContracts} libraryId={libraryId} />}
          {activeTab === 'errors' && <ErrorsTable errors={errors} currentContract={contract} allContracts={allContracts} libraryId={libraryId} />}
          {activeTab === 'functions' && (
            <FunctionsTable
              externalFunctions={contract.externalFunctions || []}
              internalFunctions={contract.internalFunctions || []}
              currentContract={contract}
              allContracts={allContracts}
              libraryId={libraryId}
            />
          )}
          {activeTab === 'source' && (
            <SourceCodeTab sourceCode={contract.sourceCode} />
          )}
        </div>
      </div>
    </div>
  );
}

function VariablesTable({ variables, currentContract, allContracts, libraryId }: { variables: InheritedStateVariable[]; currentContract: Contract; allContracts: Contract[]; libraryId?: string | null }) {
  if (variables.length === 0) {
    return <EmptyState message="No state variables defined" />;
  }

  const constants = variables.filter(v => v.isConstant);
  const immutables = variables.filter(v => v.isImmutable);
  const mappings = variables.filter(v => v.type.startsWith('mapping'));
  const arrays = variables.filter(v => v.type.includes('[]') && !v.isConstant && !v.isImmutable);
  const regular = variables.filter(v => !v.isConstant && !v.isImmutable && !v.type.startsWith('mapping') && !v.type.includes('[]'));

  return (
    <div className="space-y-6">
      {constants.length > 0 && <VariableSection title="Constants" variables={constants} currentContract={currentContract} allContracts={allContracts} libraryId={libraryId} />}
      {immutables.length > 0 && <VariableSection title="Immutables" variables={immutables} currentContract={currentContract} allContracts={allContracts} libraryId={libraryId} />}
      {mappings.length > 0 && <MappingSection title="Mappings" variables={mappings} currentContract={currentContract} allContracts={allContracts} libraryId={libraryId} />}
      {arrays.length > 0 && <VariableSection title="Arrays" variables={arrays} currentContract={currentContract} allContracts={allContracts} libraryId={libraryId} />}
      {regular.length > 0 && <VariableSection title="State Variables" variables={regular} currentContract={currentContract} allContracts={allContracts} libraryId={libraryId} />}
    </div>
  );
}

function VariableSection({ title, variables, currentContract, allContracts, libraryId }: { title: string; variables: InheritedStateVariable[]; currentContract: Contract; allContracts: Contract[]; libraryId?: string | null }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2 hover:text-white"
      >
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        {title}
        <span className="text-xs text-slate-500">({variables.length})</span>
      </button>
      {isOpen && (
        <div className="text-sm">
          {/* Header */}
          <div className="grid grid-cols-4 gap-4 text-slate-500 border-b border-navy-600 pb-2 mb-1">
            <div className="font-medium">Name</div>
            <div className="font-medium">Type</div>
            <div className="font-medium">Visibility</div>
            <div className="font-medium">Source</div>
          </div>
          {/* Rows */}
          {variables.map((v, i) => (
            <div key={i} className="grid grid-cols-4 gap-4 items-center py-2 border-b border-navy-700/50 hover:bg-navy-800/50">
              <div className="font-mono text-mint">{v.name}</div>
              <div className="font-mono text-cyan-400">{v.type}</div>
              <div>
                <span className={clsx(
                  'text-xs px-1.5 py-0.5 rounded',
                  v.visibility === 'public' && 'bg-green-500/20 text-green-400',
                  v.visibility === 'internal' && 'bg-blue-500/20 text-blue-400',
                  v.visibility === 'private' && 'bg-red-500/20 text-red-400'
                )}>
                  {v.visibility}
                </span>
              </div>
              <div>
                <InheritanceBadge
                  contractName={v.inheritedFrom || currentContract.name}
                  allContracts={allContracts}
                  libraryId={libraryId}
                  startLine={v.startLine}
                  currentContract={v.inheritedFrom ? undefined : currentContract}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MappingSection({ title, variables, currentContract, allContracts, libraryId }: { title: string; variables: InheritedStateVariable[]; currentContract: Contract; allContracts: Contract[]; libraryId?: string | null }) {
  const [isOpen, setIsOpen] = useState(true);

  const parseMappingType = (type: string): { key: string; value: string } => {
    const match = type.match(/mapping\((.+?)\s*=>\s*(.+)\)/);
    if (match) {
      return { key: match[1].trim(), value: match[2].trim() };
    }
    return { key: 'unknown', value: 'unknown' };
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2 hover:text-white"
      >
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        {title}
        <span className="text-xs text-slate-500">({variables.length})</span>
      </button>
      {isOpen && (
        <div className="text-sm">
          {/* Header */}
          <div className="grid grid-cols-5 gap-4 text-slate-500 border-b border-navy-600 pb-2 mb-1">
            <div className="font-medium">Name</div>
            <div className="font-medium">Key Type</div>
            <div className="font-medium">Value Type</div>
            <div className="font-medium">Visibility</div>
            <div className="font-medium">Source</div>
          </div>
          {/* Rows */}
          {variables.map((v, i) => {
            const { key, value } = parseMappingType(v.type);
            return (
              <div key={i} className="grid grid-cols-5 gap-4 items-center py-2 border-b border-navy-700/50 hover:bg-navy-800/50">
                <div className="font-mono text-mint">{v.name}</div>
                <div className="font-mono text-amber-400">{key}</div>
                <div className="font-mono text-cyan-400">{value}</div>
                <div>
                  <span className={clsx(
                    'text-xs px-1.5 py-0.5 rounded',
                    v.visibility === 'public' && 'bg-green-500/20 text-green-400',
                    v.visibility === 'internal' && 'bg-blue-500/20 text-blue-400',
                    v.visibility === 'private' && 'bg-red-500/20 text-red-400'
                  )}>
                    {v.visibility}
                  </span>
                </div>
                <div>
                  <InheritanceBadge
                    contractName={v.inheritedFrom || currentContract.name}
                    allContracts={allContracts}
                    libraryId={libraryId}
                    startLine={v.startLine}
                    currentContract={v.inheritedFrom ? undefined : currentContract}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EventsTable({ events, currentContract, allContracts, libraryId }: { events: InheritedEventDefinition[]; currentContract: Contract; allContracts: Contract[]; libraryId?: string | null }) {
  if (events.length === 0) {
    return <EmptyState message="No events defined" />;
  }

  return (
    <div className="space-y-4">
      {events.map((event, i) => (
        <div key={i} className="border border-navy-600 rounded-lg overflow-hidden">
          <div className="bg-navy-800/50 px-4 py-2 border-b border-navy-600 flex items-center justify-between">
            <span className="font-mono font-medium text-amber-400">{event.name}</span>
            <InheritanceBadge
              contractName={event.inheritedFrom || currentContract.name}
              allContracts={allContracts}
              libraryId={libraryId}
              startLine={event.startLine}
              currentContract={event.inheritedFrom ? undefined : currentContract}
            />
          </div>
          {event.parameters.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-navy-700">
                  <th className="px-4 py-2 font-medium">Parameter</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Indexed</th>
                </tr>
              </thead>
              <tbody>
                {event.parameters.map((param, j) => (
                  <tr key={j} className="border-b border-navy-700/50 hover:bg-navy-800/50">
                    <td className="px-4 py-2 font-mono text-slate-300">{param.name || `param${j}`}</td>
                    <td className="px-4 py-2 font-mono text-cyan-400">{param.type}</td>
                    <td className="px-4 py-2">
                      {param.indexed ? (
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">indexed</span>
                      ) : (
                        <span className="text-xs text-slate-600">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-4 py-3 text-sm text-slate-500">No parameters</div>
          )}
        </div>
      ))}
    </div>
  );
}

function ErrorsTable({ errors, currentContract, allContracts, libraryId }: { errors: InheritedErrorDefinition[]; currentContract: Contract; allContracts: Contract[]; libraryId?: string | null }) {
  if (errors.length === 0) {
    return <EmptyState message="No custom errors defined" />;
  }

  return (
    <div className="space-y-4">
      {errors.map((error, i) => (
        <div key={i} className="border border-navy-600 rounded-lg overflow-hidden">
          <div className="bg-navy-800/50 px-4 py-2 border-b border-navy-600 flex items-center justify-between">
            <span className="font-mono font-medium text-red-400">{error.name}</span>
            <InheritanceBadge
              contractName={error.inheritedFrom || currentContract.name}
              allContracts={allContracts}
              libraryId={libraryId}
              startLine={error.startLine}
              currentContract={error.inheritedFrom ? undefined : currentContract}
            />
          </div>
          {error.parameters.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-navy-700">
                  <th className="px-4 py-2 font-medium">Parameter</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                </tr>
              </thead>
              <tbody>
                {error.parameters.map((param, j) => (
                  <tr key={j} className="border-b border-navy-700/50 hover:bg-navy-800/50">
                    <td className="px-4 py-2 font-mono text-slate-300">{param.name || `param${j}`}</td>
                    <td className="px-4 py-2 font-mono text-cyan-400">{param.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-4 py-3 text-sm text-slate-500">No parameters</div>
          )}
        </div>
      ))}
    </div>
  );
}

function StructsTable({ structs, currentContract, allContracts, libraryId }: { structs: InheritedStructDefinition[]; currentContract: Contract; allContracts: Contract[]; libraryId?: string | null }) {
  if (structs.length === 0) {
    return <EmptyState message="No structs defined" />;
  }

  return (
    <div className="space-y-4">
      {structs.map((struct, i) => (
        <div key={i} className="border border-navy-600 rounded-lg overflow-hidden">
          <div className="bg-navy-800/50 px-4 py-2 border-b border-navy-600 flex items-center justify-between">
            <span className="font-mono font-medium text-orange-400">{struct.name}</span>
            <InheritanceBadge
              contractName={struct.inheritedFrom || currentContract.name}
              allContracts={allContracts}
              libraryId={libraryId}
              startLine={struct.startLine}
              currentContract={struct.inheritedFrom ? undefined : currentContract}
            />
          </div>
          {struct.members.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-navy-700">
                  <th className="px-4 py-2 font-medium">Member</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                </tr>
              </thead>
              <tbody>
                {struct.members.map((member, j) => (
                  <tr key={j} className="border-b border-navy-700/50 hover:bg-navy-800/50">
                    <td className="px-4 py-2 font-mono text-slate-300">{member.name || `member${j}`}</td>
                    <td className="px-4 py-2 font-mono text-cyan-400">{member.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-4 py-3 text-sm text-slate-500">No members</div>
          )}
        </div>
      ))}
    </div>
  );
}

function FunctionsTable({
  externalFunctions,
  internalFunctions,
  currentContract,
  allContracts,
  libraryId,
}: {
  externalFunctions: ExternalFunction[];
  internalFunctions: InternalFunction[];
  currentContract: Contract;
  allContracts: Contract[];
  libraryId?: string | null;
}) {
  const [showExternal, setShowExternal] = useState(true);
  const [showInternal, setShowInternal] = useState(true);

  if (externalFunctions.length === 0 && internalFunctions.length === 0) {
    return <EmptyState message="No functions defined" />;
  }

  return (
    <div className="space-y-6">
      {externalFunctions.length > 0 && (
        <div>
          <button
            onClick={() => setShowExternal(!showExternal)}
            className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3 hover:text-white"
          >
            {showExternal ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            External / Public Functions
            <span className="text-xs text-slate-500">({externalFunctions.length})</span>
          </button>
          {showExternal && (
            <div className="space-y-3">
              {externalFunctions.map((func, i) => (
                <FunctionCard key={i} func={func} type="external" currentContract={currentContract} allContracts={allContracts} libraryId={libraryId} />
              ))}
            </div>
          )}
        </div>
      )}

      {internalFunctions.length > 0 && (
        <div>
          <button
            onClick={() => setShowInternal(!showInternal)}
            className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3 hover:text-white"
          >
            {showInternal ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            Internal / Private Functions
            <span className="text-xs text-slate-500">({internalFunctions.length})</span>
          </button>
          {showInternal && (
            <div className="space-y-3">
              {internalFunctions.map((func, i) => (
                <FunctionCard key={i} func={func} type="internal" currentContract={currentContract} allContracts={allContracts} libraryId={libraryId} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FunctionCard({ func, type, currentContract, allContracts, libraryId }: { func: ExternalFunction | InternalFunction; type: 'external' | 'internal'; currentContract: Contract; allContracts: Contract[]; libraryId?: string | null }) {
  const [isOpen, setIsOpen] = useState(false);

  const visibilityColors: Record<string, string> = {
    external: 'bg-green-500/20 text-green-400',
    public: 'bg-green-500/20 text-green-400',
    internal: 'bg-blue-500/20 text-blue-400',
    private: 'bg-red-500/20 text-red-400',
  };

  const mutabilityColors: Record<string, string> = {
    pure: 'bg-purple-500/20 text-purple-400',
    view: 'bg-cyan-500/20 text-cyan-400',
    nonpayable: 'bg-slate-500/20 text-slate-400',
    payable: 'bg-amber-500/20 text-amber-400',
  };

  // For functions, check if inherited (functions have inheritedFrom field)
  const inheritedFrom = 'inheritedFrom' in func ? func.inheritedFrom : undefined;

  return (
    <div className="border border-navy-600 rounded-lg overflow-hidden">
      <div className="w-full bg-navy-800/50 px-4 py-2 border-b border-navy-600 flex items-center justify-between hover:bg-navy-800">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          <span className="font-mono font-medium text-mint">{func.name}</span>
          <span className={clsx('text-[10px] px-1.5 py-0.5 rounded', visibilityColors[func.visibility])}>
            {func.visibility}
          </span>
          <span className={clsx('text-[10px] px-1.5 py-0.5 rounded', mutabilityColors[func.stateMutability])}>
            {func.stateMutability}
          </span>
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            Params {func.parameters.length} → Returns {func.returnValues.length}
          </span>
          <InheritanceBadge
            contractName={inheritedFrom || currentContract.name}
            allContracts={allContracts}
            libraryId={libraryId}
            startLine={func.startLine}
            currentContract={inheritedFrom ? undefined : currentContract}
          />
        </div>
      </div>

      {isOpen && (
        <div className="p-4 space-y-4">
          <div>
            <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-2">Parameters</h4>
            {func.parameters.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-navy-700">
                    <th className="pb-2 pr-4 font-medium">Name</th>
                    <th className="pb-2 pr-4 font-medium">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {func.parameters.map((param, j) => (
                    <tr key={j} className="border-b border-navy-700/50">
                      <td className="py-1.5 pr-4 font-mono text-slate-300">{param.name || `param${j}`}</td>
                      <td className="py-1.5 pr-4 font-mono text-cyan-400">{param.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-sm text-slate-500">No parameters</div>
            )}
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-2">Return Values</h4>
            {func.returnValues.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-navy-700">
                    <th className="pb-2 pr-4 font-medium">Name</th>
                    <th className="pb-2 pr-4 font-medium">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {func.returnValues.map((ret, j) => (
                    <tr key={j} className="border-b border-navy-700/50">
                      <td className="py-1.5 pr-4 font-mono text-slate-300">{ret.name || `return${j}`}</td>
                      <td className="py-1.5 pr-4 font-mono text-cyan-400">{ret.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-sm text-slate-500">No return values</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SourceCodeTab({ sourceCode }: { sourceCode?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (sourceCode) {
      await navigator.clipboard.writeText(sourceCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!sourceCode) {
    return <EmptyState message="Source code not available" />;
  }

  return (
    <div className="relative">
      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-700 hover:bg-navy-600 text-slate-300 hover:text-white transition-colors text-sm"
        title="Copy source code"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-green-400" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            <span>Copy</span>
          </>
        )}
      </button>

      {/* Source code with line numbers and syntax highlighting */}
      <div className="overflow-x-auto bg-navy-950 rounded-lg border border-navy-700">
        <pre className="text-sm leading-relaxed">
          <code>
            <SourceCodeHighlighted sourceCode={sourceCode} />
          </code>
        </pre>
      </div>
    </div>
  );
}

// Solidity syntax highlighting with multi-line comment support
function SourceCodeHighlighted({ sourceCode }: { sourceCode: string }) {
  const lines = sourceCode.split('\n');
  let inMultiLineComment = false;

  return (
    <>
      {lines.map((line, index) => {
        const { highlighted, stillInComment } = highlightSolidityLine(line, inMultiLineComment);
        inMultiLineComment = stillInComment;
        return (
          <div key={index} className="flex hover:bg-navy-800/50">
            <span className="flex-shrink-0 w-12 px-3 py-0.5 text-right text-slate-600 select-none border-r border-navy-700 bg-navy-900/50">
              {index + 1}
            </span>
            <span className="flex-1 px-4 py-0.5 text-slate-300 font-mono whitespace-pre">
              {highlighted}
            </span>
          </div>
        );
      })}
    </>
  );
}

// Solidity keyword and type sets
const SOLIDITY_KEYWORDS = new Set([
  // Declaration keywords
  'contract', 'interface', 'library', 'abstract', 'function', 'modifier',
  'event', 'error', 'struct', 'enum', 'mapping', 'constructor', 'fallback', 'receive',
  // Visibility
  'public', 'private', 'internal', 'external',
  // Mutability
  'view', 'pure', 'payable', 'nonpayable',
  // Modifiers
  'virtual', 'override', 'constant', 'immutable', 'indexed', 'anonymous',
  // Control flow
  'returns', 'return', 'if', 'else', 'for', 'while', 'do', 'break', 'continue',
  'try', 'catch', 'revert', 'require', 'assert', 'throw',
  // Other keywords
  'emit', 'new', 'delete', 'this', 'super', 'is', 'using', 'import', 'from', 'as',
  'pragma', 'solidity', 'memory', 'storage', 'calldata', 'assembly', 'let', 'true', 'false',
  'wei', 'gwei', 'ether', 'seconds', 'minutes', 'hours', 'days', 'weeks', 'years',
  'unchecked',
]);

const SOLIDITY_TYPES = new Set([
  'address', 'bool', 'string', 'bytes', 'byte',
  'int', 'uint',
  'int8', 'int16', 'int24', 'int32', 'int40', 'int48', 'int56', 'int64',
  'int72', 'int80', 'int88', 'int96', 'int104', 'int112', 'int120', 'int128',
  'int136', 'int144', 'int152', 'int160', 'int168', 'int176', 'int184', 'int192',
  'int200', 'int208', 'int216', 'int224', 'int232', 'int240', 'int248', 'int256',
  'uint8', 'uint16', 'uint24', 'uint32', 'uint40', 'uint48', 'uint56', 'uint64',
  'uint72', 'uint80', 'uint88', 'uint96', 'uint104', 'uint112', 'uint120', 'uint128',
  'uint136', 'uint144', 'uint152', 'uint160', 'uint168', 'uint176', 'uint184', 'uint192',
  'uint200', 'uint208', 'uint216', 'uint224', 'uint232', 'uint240', 'uint248', 'uint256',
  'bytes1', 'bytes2', 'bytes3', 'bytes4', 'bytes5', 'bytes6', 'bytes7', 'bytes8',
  'bytes9', 'bytes10', 'bytes11', 'bytes12', 'bytes13', 'bytes14', 'bytes15', 'bytes16',
  'bytes17', 'bytes18', 'bytes19', 'bytes20', 'bytes21', 'bytes22', 'bytes23', 'bytes24',
  'bytes25', 'bytes26', 'bytes27', 'bytes28', 'bytes29', 'bytes30', 'bytes31', 'bytes32',
]);

const SOLIDITY_BUILTINS = new Set([
  'msg', 'block', 'tx', 'abi', 'type',
  'keccak256', 'sha256', 'ripemd160', 'ecrecover',
  'addmod', 'mulmod', 'selfdestruct',
  'gasleft', 'blockhash',
]);

function highlightSolidityLine(line: string, inMultiLineComment: boolean): { highlighted: React.ReactNode; stillInComment: boolean } {
  const parts: React.ReactNode[] = [];
  let key = 0;
  let i = 0;
  let currentInComment = inMultiLineComment;

  while (i < line.length) {
    // If we're in a multi-line comment, look for the end
    if (currentInComment) {
      const endIdx = line.indexOf('*/', i);
      if (endIdx !== -1) {
        parts.push(<span key={key++} className="text-green-600 italic">{line.slice(i, endIdx + 2)}</span>);
        i = endIdx + 2;
        currentInComment = false;
      } else {
        parts.push(<span key={key++} className="text-green-600 italic">{line.slice(i)}</span>);
        return { highlighted: parts, stillInComment: true };
      }
      continue;
    }

    // Check for single-line comment
    if (line.slice(i, i + 2) === '//') {
      // NatSpec with /// gets special color
      const isNatSpec = line.slice(i, i + 3) === '///';
      parts.push(
        <span key={key++} className={isNatSpec ? "text-green-500 italic" : "text-green-600 italic"}>
          {line.slice(i)}
        </span>
      );
      return { highlighted: parts, stillInComment: false };
    }

    // Check for multi-line comment start
    if (line.slice(i, i + 2) === '/*') {
      const isNatSpec = line.slice(i, i + 3) === '/**';
      const endIdx = line.indexOf('*/', i + 2);
      if (endIdx !== -1) {
        parts.push(
          <span key={key++} className={isNatSpec ? "text-green-500 italic" : "text-green-600 italic"}>
            {line.slice(i, endIdx + 2)}
          </span>
        );
        i = endIdx + 2;
      } else {
        parts.push(
          <span key={key++} className={isNatSpec ? "text-green-500 italic" : "text-green-600 italic"}>
            {line.slice(i)}
          </span>
        );
        return { highlighted: parts, stillInComment: true };
      }
      continue;
    }

    // Check for string
    if (line[i] === '"' || line[i] === "'") {
      const quote = line[i];
      let j = i + 1;
      while (j < line.length && line[j] !== quote) {
        if (line[j] === '\\') j++; // Skip escaped char
        j++;
      }
      parts.push(<span key={key++} className="text-amber-400">{line.slice(i, j + 1)}</span>);
      i = j + 1;
      continue;
    }

    // Check for hex number
    if (line.slice(i, i + 2) === '0x') {
      let j = i + 2;
      while (j < line.length && /[0-9a-fA-F]/.test(line[j])) j++;
      parts.push(<span key={key++} className="text-purple-400">{line.slice(i, j)}</span>);
      i = j;
      continue;
    }

    // Check for number
    if (/[0-9]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[0-9_]/.test(line[j])) j++;
      // Check for decimal
      if (line[j] === '.' && /[0-9]/.test(line[j + 1])) {
        j++;
        while (j < line.length && /[0-9_]/.test(line[j])) j++;
      }
      // Check for exponent
      if ((line[j] === 'e' || line[j] === 'E') && /[0-9+-]/.test(line[j + 1])) {
        j++;
        if (line[j] === '+' || line[j] === '-') j++;
        while (j < line.length && /[0-9]/.test(line[j])) j++;
      }
      parts.push(<span key={key++} className="text-purple-400">{line.slice(i, j)}</span>);
      i = j;
      continue;
    }

    // Check for identifier (keyword, type, etc.)
    if (/[a-zA-Z_$]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[a-zA-Z0-9_$]/.test(line[j])) j++;
      const word = line.slice(i, j);

      if (SOLIDITY_KEYWORDS.has(word)) {
        parts.push(<span key={key++} className="text-pink-400 font-medium">{word}</span>);
      } else if (SOLIDITY_TYPES.has(word)) {
        parts.push(<span key={key++} className="text-cyan-400">{word}</span>);
      } else if (SOLIDITY_BUILTINS.has(word)) {
        parts.push(<span key={key++} className="text-yellow-400">{word}</span>);
      } else if (word[0] === word[0].toUpperCase() && word[0] !== '_') {
        // PascalCase - likely contract/interface/struct name
        parts.push(<span key={key++} className="text-blue-400">{word}</span>);
      } else if (word.startsWith('_')) {
        // Internal function or variable
        parts.push(<span key={key++} className="text-slate-400">{word}</span>);
      } else {
        parts.push(<span key={key++}>{word}</span>);
      }
      i = j;
      continue;
    }

    // Check for operators
    if (/[+\-*/%=<>!&|^~?:]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[+\-*/%=<>!&|^~?:]/.test(line[j])) j++;
      parts.push(<span key={key++} className="text-rose-400">{line.slice(i, j)}</span>);
      i = j;
      continue;
    }

    // Default: just add the character
    parts.push(<span key={key++}>{line[i]}</span>);
    i++;
  }

  return { highlighted: parts.length > 0 ? parts : line, stillInComment: currentInComment };
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-40 text-slate-500">
      {message}
    </div>
  );
}
