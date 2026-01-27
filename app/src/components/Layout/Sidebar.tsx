'use client';

import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, FileCode2, Folder, FolderOpen } from 'lucide-react';
import clsx from 'clsx';
import type { CallGraph, DirectoryNode, Contract, ContractCategory } from '@/types/callGraph';
import { categoryLabels, categoryStyles } from '@/components/Canvas/CategoryGroupNode';

interface SidebarProps {
  callGraph: CallGraph;
  selectedContract: string | null;
  onSelectContract: (name: string) => void;
  visibleCategories?: ContractCategory[];
  onCategoryToggle?: (category: ContractCategory) => void;
}

// Category order for display (aligned with OpenZeppelin structure)
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

export function Sidebar({
  callGraph,
  selectedContract,
  onSelectContract,
  visibleCategories,
  onCategoryToggle,
}: SidebarProps) {
  const [showLegend, setShowLegend] = useState(false);
  const [showProxyGroups, setShowProxyGroups] = useState(false);
  const [showStructure, setShowStructure] = useState(true);
  const [showCategories, setShowCategories] = useState(true);

  // Get available categories from contracts
  const availableCategories = useMemo(() => {
    const categories = new Map<ContractCategory, number>();
    for (const contract of callGraph.contracts) {
      if (contract.kind === 'contract' || contract.kind === 'abstract') {
        const count = categories.get(contract.category) || 0;
        categories.set(contract.category, count + 1);
      }
    }
    return categories;
  }, [callGraph.contracts]);

  return (
    <aside className="w-[280px] h-full bg-navy-800 border-r border-navy-600 flex flex-col">
      {/* Tree View */}
      <div className="flex-1 overflow-y-auto p-3">
        <button
          onClick={() => setShowStructure(!showStructure)}
          className="w-full flex items-center justify-between text-xs uppercase tracking-wider text-slate-500 font-medium mb-2 px-2 hover:text-slate-400"
        >
          <span>Project Structure</span>
          {showStructure ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </button>
        {showStructure && callGraph.structure && (
          <TreeNode
            node={callGraph.structure}
            contracts={callGraph.contracts}
            selectedContract={selectedContract}
            onSelectContract={onSelectContract}
          />
        )}
        {showStructure && !callGraph.structure?.children?.length && (
          <div className="text-xs text-slate-500 px-2 py-4 text-center">
            No directory structure
          </div>
        )}
      </div>

      {/* Category Filter */}
      {availableCategories.size > 0 && onCategoryToggle && (
        <div className="border-t border-navy-600 p-4">
          <button
            onClick={() => setShowCategories(!showCategories)}
            className="w-full flex items-center justify-between text-xs uppercase tracking-wider text-slate-500 font-medium mb-3 hover:text-slate-400"
          >
            <span>Categories</span>
            {showCategories ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
          {showCategories && (
            <div className="space-y-1.5">
              {CATEGORY_ORDER.map((category) => {
                const count = availableCategories.get(category);
                if (!count) return null;
                const style = categoryStyles[category];
                const isVisible = !visibleCategories || visibleCategories.includes(category);
                return (
                  <label
                    key={category}
                    className={clsx(
                      'flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors',
                      isVisible ? 'bg-navy-700/50 hover:bg-navy-700' : 'hover:bg-navy-700/30 opacity-50'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={() => onCategoryToggle(category)}
                      className="w-3.5 h-3.5 rounded border-navy-500 bg-navy-700 text-mint focus:ring-mint/50 focus:ring-offset-0"
                    />
                    <span className="text-sm">{style.icon}</span>
                    <span className={clsx('text-xs flex-1', style.text)}>
                      {categoryLabels[category]}
                    </span>
                    <span className="text-[10px] text-slate-500 bg-navy-600 px-1.5 py-0.5 rounded">
                      {count}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="border-t border-navy-600 p-4">
        <button
          onClick={() => setShowLegend(!showLegend)}
          className="w-full flex items-center justify-between text-xs uppercase tracking-wider text-slate-500 font-medium mb-3 hover:text-slate-400"
        >
          <span>Legend</span>
          {showLegend ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </button>
        {showLegend && (
          <div className="space-y-2 text-xs">
            {/* Functions */}
            <div className="text-[10px] uppercase tracking-wider text-slate-600 mb-1">Functions</div>
            <div className="flex items-center gap-2">
              <span className="text-mint">○</span>
              <span className="text-slate-400">external view/pure</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-coral">●</span>
              <span className="text-slate-400">external write</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lavender">◇</span>
              <span className="text-slate-400">internal view/pure</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-coral">◆</span>
              <span className="text-slate-400">internal write</span>
            </div>

            {/* Edges */}
            <div className="text-[10px] uppercase tracking-wider text-slate-600 mt-3 mb-1">Relationships</div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-blue-400" />
              <span className="text-slate-400">inherits</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-amber border-dashed border-t border-amber" />
              <span className="text-slate-400">uses</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-indigo-400" />
              <span className="text-slate-400">implements</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-pink-400 border-dashed border-t border-pink-400" />
              <span className="text-slate-400">delegatecall</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-violet-400 border-dashed border-t border-violet-400" />
              <span className="text-slate-400">registers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-slate-400 border-dashed border-t border-slate-400" />
              <span className="text-slate-400">imports</span>
            </div>
          </div>
        )}

        {/* Proxy Patterns */}
        {callGraph.proxyGroups && callGraph.proxyGroups.length > 0 && (
          <div className="mt-4 pt-3 border-t border-navy-600">
            <button
              onClick={() => setShowProxyGroups(!showProxyGroups)}
              className="w-full flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-2 hover:text-slate-400"
            >
              <span>🔀 Proxy Architecture</span>
              {showProxyGroups ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
            {showProxyGroups && (
              <div className="space-y-3">
                {callGraph.proxyGroups.map((group) => {
                  const patternColors: Record<string, string> = {
                    eip7546: 'border-emerald-500/60 bg-emerald-500/5',
                    uups: 'border-blue-500/60 bg-blue-500/5',
                    transparent: 'border-amber-500/60 bg-amber-500/5',
                    diamond: 'border-purple-500/60 bg-purple-500/5',
                    beacon: 'border-cyan-500/60 bg-cyan-500/5',
                  };
                  const patternLabels: Record<string, string> = {
                    eip7546: 'ERC-7546',
                    uups: 'UUPS',
                    transparent: 'Transparent',
                    diamond: 'Diamond',
                    beacon: 'Beacon',
                  };
                  const patternTextColors: Record<string, string> = {
                    eip7546: 'text-emerald-400',
                    uups: 'text-blue-400',
                    transparent: 'text-amber-400',
                    diamond: 'text-purple-400',
                    beacon: 'text-cyan-400',
                  };

                  return (
                    <div
                      key={group.id}
                      className={clsx(
                        'rounded-lg border p-2',
                        patternColors[group.patternType] || 'border-slate-600 bg-slate-800/20'
                      )}
                    >
                      {/* Group Header */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-[11px] text-slate-200">
                          {group.name}
                        </span>
                        <span className={clsx(
                          'text-[9px] px-1.5 py-0.5 rounded font-medium',
                          patternTextColors[group.patternType] || 'text-slate-400'
                        )}>
                          {patternLabels[group.patternType] || group.patternType}
                        </span>
                      </div>

                      {/* Group Details */}
                      <div className="space-y-1 text-[10px]">
                        {group.dictionary && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-emerald-400">📖</span>
                            <span
                              className="text-slate-400 hover:text-emerald-300 cursor-pointer truncate"
                              onClick={() => onSelectContract(group.dictionary!)}
                            >
                              {group.dictionary}
                            </span>
                          </div>
                        )}
                        {group.proxy && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-blue-400">🔀</span>
                            <span
                              className="text-slate-400 hover:text-blue-300 cursor-pointer truncate"
                              onClick={() => onSelectContract(group.proxy!)}
                            >
                              {group.proxy}
                            </span>
                          </div>
                        )}
                        {group.implementations.length > 0 && (
                          <div className="mt-1.5 pt-1.5 border-t border-slate-700/50">
                            <div className="text-slate-500 mb-1">
                              ⚡ Implementations ({group.implementations.length})
                            </div>
                            <div className="pl-3 space-y-0.5 max-h-[80px] overflow-y-auto">
                              {group.implementations.map((impl) => (
                                <div
                                  key={impl}
                                  className="text-slate-400 hover:text-purple-300 cursor-pointer truncate"
                                  onClick={() => onSelectContract(impl)}
                                >
                                  {impl}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="border-t border-navy-600 p-4">
        <h3 className="text-xs uppercase tracking-wider text-slate-500 font-medium mb-3">
          Statistics
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-navy-700 rounded p-2">
            <div className="text-xl font-semibold text-mint">{callGraph.stats.totalContracts}</div>
            <div className="text-slate-500">Contracts</div>
          </div>
          <div className="bg-navy-700 rounded p-2">
            <div className="text-xl font-semibold text-amber">{callGraph.stats.totalLibraries}</div>
            <div className="text-slate-500">Libraries</div>
          </div>
          <div className="bg-navy-700 rounded p-2">
            <div className="text-xl font-semibold text-indigo-400">{callGraph.stats.totalInterfaces}</div>
            <div className="text-slate-500">Interfaces</div>
          </div>
          <div className="bg-navy-700 rounded p-2">
            <div className="text-xl font-semibold text-slate-300">{callGraph.stats.totalFunctions}</div>
            <div className="text-slate-500">Functions</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

interface TreeNodeProps {
  node: DirectoryNode;
  contracts: Contract[];
  selectedContract: string | null;
  onSelectContract: (name: string) => void;
  depth?: number;
}

function TreeNode({ node, contracts, selectedContract, onSelectContract, depth = 0 }: TreeNodeProps) {
  const [isOpen, setIsOpen] = useState(depth < 2);

  const isDirectory = node.type === 'directory';
  const hasChildren = isDirectory && node.children && node.children.length > 0;

  // Find contract if this is a file
  const contract = node.contractName
    ? contracts.find((c) => c.name === node.contractName)
    : null;

  const isSelected = contract && selectedContract === contract.name;

  const handleClick = () => {
    if (isDirectory && hasChildren) {
      setIsOpen(!isOpen);
    } else if (contract) {
      onSelectContract(contract.name);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={clsx(
          'w-full flex items-center gap-1.5 px-2 py-1 rounded text-sm text-left',
          'hover:bg-navy-600 transition-colors',
          isSelected && 'bg-mint/10 text-mint'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {/* Expand/Collapse Icon */}
        {hasChildren ? (
          isOpen ? (
            <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
          )
        ) : (
          <span className="w-4" />
        )}

        {/* Icon */}
        {isDirectory ? (
          isOpen ? (
            <FolderOpen className="w-4 h-4 text-amber flex-shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-amber flex-shrink-0" />
          )
        ) : (
          <FileCode2
            className={clsx(
              'w-4 h-4 flex-shrink-0',
              contract?.kind === 'library' ? 'text-amber' : 'text-mint'
            )}
          />
        )}

        {/* Name */}
        <span
          className={clsx(
            'truncate font-display',
            isSelected ? 'text-mint' : 'text-slate-300'
          )}
        >
          {node.name}
        </span>

        {/* Contract kind badge */}
        {contract && (
          <span
            className={clsx(
              'ml-auto text-[10px] px-1.5 rounded',
              contract.kind === 'library' && 'bg-amber/20 text-amber',
              contract.kind === 'interface' && 'bg-indigo-500/20 text-indigo-400',
              contract.kind === 'contract' && 'bg-mint/20 text-mint'
            )}
          >
            {contract.kind === 'library' ? 'lib' : contract.kind === 'interface' ? 'iface' : ''}
          </span>
        )}
      </button>

      {/* Children */}
      {isOpen && hasChildren && (
        <div>
          {node.children!.map((child, index) => (
            <TreeNode
              key={`${child.path}-${index}`}
              node={child}
              contracts={contracts}
              selectedContract={selectedContract}
              onSelectContract={onSelectContract}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
