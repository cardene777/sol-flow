'use client';

import { useState, useMemo } from 'react';
import { X, ChevronDown, ChevronRight, Variable, Zap, AlertTriangle, FunctionSquare, ExternalLink, Braces } from 'lucide-react';
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

type TabType = 'variables' | 'structs' | 'events' | 'errors' | 'functions';

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

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'variables', label: '変数', icon: <Variable className="w-4 h-4" />, count: stateVariables.length },
    { id: 'structs', label: '構造体', icon: <Braces className="w-4 h-4" />, count: structs.length },
    { id: 'events', label: 'イベント', icon: <Zap className="w-4 h-4" />, count: events.length },
    { id: 'errors', label: 'エラー', icon: <AlertTriangle className="w-4 h-4" />, count: errors.length },
    { id: 'functions', label: '関数', icon: <FunctionSquare className="w-4 h-4" />, count: (contract.externalFunctions?.length || 0) + (contract.internalFunctions?.length || 0) },
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
              <span className="text-[10px] bg-navy-700 px-1.5 py-0.5 rounded">
                {tab.count}
              </span>
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
        </div>
      </div>
    </div>
  );
}

function VariablesTable({ variables, currentContract, allContracts, libraryId }: { variables: InheritedStateVariable[]; currentContract: Contract; allContracts: Contract[]; libraryId?: string | null }) {
  if (variables.length === 0) {
    return <EmptyState message="状態変数が定義されていません" />;
  }

  const constants = variables.filter(v => v.isConstant);
  const immutables = variables.filter(v => v.isImmutable);
  const mappings = variables.filter(v => v.type.startsWith('mapping'));
  const arrays = variables.filter(v => v.type.includes('[]') && !v.isConstant && !v.isImmutable);
  const regular = variables.filter(v => !v.isConstant && !v.isImmutable && !v.type.startsWith('mapping') && !v.type.includes('[]'));

  return (
    <div className="space-y-6">
      {constants.length > 0 && <VariableSection title="定数" variables={constants} currentContract={currentContract} allContracts={allContracts} libraryId={libraryId} />}
      {immutables.length > 0 && <VariableSection title="不変値" variables={immutables} currentContract={currentContract} allContracts={allContracts} libraryId={libraryId} />}
      {mappings.length > 0 && <MappingSection title="マッピング" variables={mappings} currentContract={currentContract} allContracts={allContracts} libraryId={libraryId} />}
      {arrays.length > 0 && <VariableSection title="配列" variables={arrays} currentContract={currentContract} allContracts={allContracts} libraryId={libraryId} />}
      {regular.length > 0 && <VariableSection title="状態変数" variables={regular} currentContract={currentContract} allContracts={allContracts} libraryId={libraryId} />}
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
            <div className="font-medium">名前</div>
            <div className="font-medium">型</div>
            <div className="font-medium">可視性</div>
            <div className="font-medium">定義元</div>
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
            <div className="font-medium">名前</div>
            <div className="font-medium">キーの型</div>
            <div className="font-medium">バリューの型</div>
            <div className="font-medium">可視性</div>
            <div className="font-medium">定義元</div>
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
    return <EmptyState message="イベントが定義されていません" />;
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
                  <th className="px-4 py-2 font-medium">パラメータ</th>
                  <th className="px-4 py-2 font-medium">型</th>
                  <th className="px-4 py-2 font-medium">インデックス</th>
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
            <div className="px-4 py-3 text-sm text-slate-500">パラメータなし</div>
          )}
        </div>
      ))}
    </div>
  );
}

function ErrorsTable({ errors, currentContract, allContracts, libraryId }: { errors: InheritedErrorDefinition[]; currentContract: Contract; allContracts: Contract[]; libraryId?: string | null }) {
  if (errors.length === 0) {
    return <EmptyState message="カスタムエラーが定義されていません" />;
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
                  <th className="px-4 py-2 font-medium">パラメータ</th>
                  <th className="px-4 py-2 font-medium">型</th>
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
            <div className="px-4 py-3 text-sm text-slate-500">パラメータなし</div>
          )}
        </div>
      ))}
    </div>
  );
}

function StructsTable({ structs, currentContract, allContracts, libraryId }: { structs: InheritedStructDefinition[]; currentContract: Contract; allContracts: Contract[]; libraryId?: string | null }) {
  if (structs.length === 0) {
    return <EmptyState message="構造体が定義されていません" />;
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
                  <th className="px-4 py-2 font-medium">メンバー名</th>
                  <th className="px-4 py-2 font-medium">型</th>
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
            <div className="px-4 py-3 text-sm text-slate-500">メンバーなし</div>
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
    return <EmptyState message="関数が定義されていません" />;
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
            外部 / 公開関数
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
            内部 / プライベート関数
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
            引数 {func.parameters.length} → 戻り値 {func.returnValues.length}
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
            <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-2">引数</h4>
            {func.parameters.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-navy-700">
                    <th className="pb-2 pr-4 font-medium">名前</th>
                    <th className="pb-2 pr-4 font-medium">型</th>
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
              <div className="text-sm text-slate-500">引数なし</div>
            )}
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-2">戻り値</h4>
            {func.returnValues.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-navy-700">
                    <th className="pb-2 pr-4 font-medium">名前</th>
                    <th className="pb-2 pr-4 font-medium">型</th>
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
              <div className="text-sm text-slate-500">戻り値なし</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-40 text-slate-500">
      {message}
    </div>
  );
}
