'use client';

import { memo, useCallback, useState, useRef, useEffect } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import clsx from 'clsx';
import { ChevronDown, ChevronRight, Info } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { FunctionItem } from '@/components/ui/FunctionItem';
import type { ContractNodeData } from '@/utils/transformToReactFlow';
import type { ExternalFunction, InternalFunction } from '@/types/callGraph';
import { useDiagramContext } from './DiagramCanvas';

function ContractNodeComponent({ data, selected }: NodeProps<ContractNodeData>) {
  const { contract, isSelected, selectedFunction, nodeHeight } = data;
  const { onFunctionClick, onHeightMeasured, onContractDetailClick } = useDiagramContext();
  const [showInternal, setShowInternal] = useState(true);
  const nodeRef = useRef<HTMLDivElement>(null);

  // Measure actual height after render and report to parent
  useEffect(() => {
    if (nodeRef.current && onHeightMeasured) {
      const actualHeight = nodeRef.current.getBoundingClientRect().height;
      onHeightMeasured(contract.name, actualHeight);
    }
  }, [contract.name, onHeightMeasured]);

  // External functions
  const externalReadFunctions = contract.externalFunctions.filter(
    (f) => f.stateMutability === 'view' || f.stateMutability === 'pure'
  );
  const externalWriteFunctions = contract.externalFunctions.filter(
    (f) => f.stateMutability !== 'view' && f.stateMutability !== 'pure'
  );

  // Internal functions
  const internalReadFunctions = contract.internalFunctions.filter(
    (f) => f.stateMutability === 'view' || f.stateMutability === 'pure'
  );
  const internalWriteFunctions = contract.internalFunctions.filter(
    (f) => f.stateMutability !== 'view' && f.stateMutability !== 'pure'
  );

  // Get icon based on kind
  const icon = contract.kind === 'interface' ? '◇' : contract.kind === 'abstract' ? '▢' : '▣';

  // Proxy pattern styling
  const proxyRoleLabels: Record<string, string> = {
    dictionary: '📖 Dict',
    proxy: '🔀 Proxy',
    implementation: '⚡ Impl',
    beacon: '📡 Beacon',
    facet: '💎 Facet',
    interface: '◇ Interface',
    library: '📚 Library',
  };
  const proxyRoleColors: Record<string, string> = {
    dictionary: 'bg-emerald-500/30 text-emerald-300 border-emerald-400/50',
    proxy: 'bg-blue-500/30 text-blue-300 border-blue-400/50',
    implementation: 'bg-purple-500/30 text-purple-300 border-purple-400/50',
    beacon: 'bg-cyan-500/30 text-cyan-300 border-cyan-400/50',
    facet: 'bg-pink-500/30 text-pink-300 border-pink-400/50',
    interface: 'bg-slate-500/30 text-slate-300 border-slate-400/50',
    library: 'bg-amber-500/30 text-amber-300 border-amber-400/50',
  };
  const proxyBorderColors: Record<string, string> = {
    eip7546: 'border-emerald-400',
    uups: 'border-blue-400',
    transparent: 'border-amber-400',
    diamond: 'border-purple-400',
    beacon: 'border-cyan-400',
  };
  const proxyPatternLabels: Record<string, string> = {
    eip7546: 'ERC-7546',
    uups: 'UUPS',
    transparent: 'Transparent',
    diamond: 'Diamond',
    beacon: 'Beacon',
  };
  const proxyHeaderColors: Record<string, string> = {
    eip7546: 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10',
    uups: 'bg-gradient-to-r from-blue-500/20 to-blue-600/10',
    transparent: 'bg-gradient-to-r from-amber-500/20 to-amber-600/10',
    diamond: 'bg-gradient-to-r from-purple-500/20 to-purple-600/10',
    beacon: 'bg-gradient-to-r from-cyan-500/20 to-cyan-600/10',
  };

  const handleFunctionClick = useCallback(
    (func: ExternalFunction | InternalFunction) => {
      // Convert to ExternalFunction format for the modal
      const funcAsExternal: ExternalFunction = {
        name: func.name,
        signature: 'signature' in func ? func.signature : func.name,
        selector: 'selector' in func ? func.selector : '',
        visibility: func.visibility as 'external' | 'public',
        stateMutability: func.stateMutability,
        parameters: func.parameters,
        returnValues: func.returnValues,
        calls: func.calls,
        emits: 'emits' in func ? func.emits : [],
        modifiers: 'modifiers' in func ? func.modifiers : [],
        isVirtual: func.isVirtual,
        sourceCode: func.sourceCode,
        startLine: func.startLine,
      };
      onFunctionClick(funcAsExternal, contract.name, contract.filePath);
    },
    [onFunctionClick, contract.name, contract.filePath]
  );

  return (
    <div
      ref={nodeRef}
      className={clsx(
        'contract-node w-[380px] rounded-xl flex flex-col',
        'bg-navy-600 shadow-node',
        contract.proxyPattern
          ? `border-2 ${proxyBorderColors[contract.proxyPattern] || 'border-mint/20'}`
          : 'border border-mint/20',
        (selected || isSelected) && 'selected'
      )}
    >
      {/* Handles for edges - both source and target at each position for flexible connections */}
      {/* Top handles */}
      <Handle id="top-target" type="target" position={Position.Top} className="!bg-mint !w-3 !h-3 !border-2 !border-navy-600" />
      <Handle id="top-source" type="source" position={Position.Top} className="!bg-mint !w-3 !h-3 !border-2 !border-navy-600 !left-[45%]" />
      {/* Bottom handles */}
      <Handle id="bottom-source" type="source" position={Position.Bottom} className="!bg-mint !w-3 !h-3 !border-2 !border-navy-600" />
      <Handle id="bottom-target" type="target" position={Position.Bottom} className="!bg-mint !w-3 !h-3 !border-2 !border-navy-600 !left-[45%]" />
      {/* Left handles */}
      <Handle id="left-target" type="target" position={Position.Left} className="!bg-mint !w-3 !h-3 !border-2 !border-navy-600" />
      <Handle id="left-source" type="source" position={Position.Left} className="!bg-mint !w-3 !h-3 !border-2 !border-navy-600 !top-[45%]" />
      {/* Right handles */}
      <Handle id="right-source" type="source" position={Position.Right} className="!bg-mint !w-3 !h-3 !border-2 !border-navy-600" />
      <Handle id="right-target" type="target" position={Position.Right} className="!bg-mint !w-3 !h-3 !border-2 !border-navy-600 !top-[45%]" />

      {/* External Library Indicator */}
      {contract.isExternalLibrary && (() => {
        // Extract version from file path (e.g., @openzeppelin/contracts@5.0.2/... -> 5.0.2)
        const versionMatch = contract.filePath.match(/@(\d+\.\d+\.\d+)/);
        const version = versionMatch ? versionMatch[1] : '';

        // Get display name with version
        const getLibraryDisplayName = () => {
          if (contract.librarySource === 'openzeppelin') {
            return version ? `OpenZeppelin@${version}` : 'OpenZeppelin';
          }
          if (contract.librarySource === 'openzeppelin-upgradeable') {
            return version ? `OZ Upgradeable@${version}` : 'OZ Upgradeable';
          }
          if (contract.librarySource === 'solady') {
            return 'Solady';
          }
          return 'External Library';
        };

        return (
          <div className={clsx(
            'px-3 py-1 text-[9px] font-bold tracking-wider flex items-center gap-2',
            contract.librarySource === 'openzeppelin' && 'bg-gradient-to-r from-blue-600/20 to-indigo-600/10',
            contract.librarySource === 'openzeppelin-upgradeable' && 'bg-gradient-to-r from-indigo-600/20 to-purple-600/10',
            contract.librarySource === 'solady' && 'bg-gradient-to-r from-yellow-600/20 to-orange-600/10',
            !contract.librarySource && 'bg-gradient-to-r from-slate-600/20 to-slate-500/10'
          )}>
            <span className="text-[10px]">📦</span>
            <span className={clsx(
              contract.librarySource === 'openzeppelin' && 'text-blue-300',
              contract.librarySource === 'openzeppelin-upgradeable' && 'text-indigo-300',
              contract.librarySource === 'solady' && 'text-yellow-300',
              !contract.librarySource && 'text-slate-300'
            )}>
              {getLibraryDisplayName()}
            </span>
          </div>
        );
      })()}

      {/* Proxy Pattern Indicator */}
      {contract.proxyPattern && (
        <div className={clsx(
          'px-3 py-1 text-[9px] font-bold tracking-wider flex items-center justify-between',
          proxyHeaderColors[contract.proxyPattern] || 'bg-slate-500/20'
        )}>
          <span className={clsx(
            contract.proxyPattern === 'eip7546' && 'text-emerald-300',
            contract.proxyPattern === 'uups' && 'text-blue-300',
            contract.proxyPattern === 'transparent' && 'text-amber-300',
            contract.proxyPattern === 'diamond' && 'text-purple-300',
            contract.proxyPattern === 'beacon' && 'text-cyan-300',
          )}>
            {proxyPatternLabels[contract.proxyPattern] || contract.proxyPattern.toUpperCase()}
          </span>
          {contract.proxyRole && (
            <span className={clsx(
              'px-1.5 py-0.5 rounded text-[8px] font-medium',
              proxyRoleColors[contract.proxyRole] || 'bg-slate-500/20 text-slate-400'
            )}>
              {proxyRoleLabels[contract.proxyRole] || contract.proxyRole}
            </span>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-mint/10">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-mint text-lg flex-shrink-0">{icon}</span>
          <span className="font-mono font-semibold text-sm text-slate-100 whitespace-nowrap">
            {contract.name}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onContractDetailClick?.(contract);
            }}
            className="p-1 rounded hover:bg-navy-500/50 text-slate-400 hover:text-mint transition-colors"
            title="View contract details"
          >
            <Info className="w-4 h-4" />
          </button>
          <Badge category={contract.category} />
        </div>
      </div>

      {/* Function Lists - nodrag class prevents ReactFlow from capturing drag events */}
      <div className="nodrag nopan p-2 space-y-2">
        {/* External / Public Section */}
        {(externalReadFunctions.length > 0 || externalWriteFunctions.length > 0) && (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-mint/70 font-semibold mb-2 px-2 flex items-center gap-1">
              <span className="text-mint">○</span> External / Public
            </div>

            {/* External Read */}
            {externalReadFunctions.length > 0 && (
              <div className="mb-2">
                <div className="text-[9px] uppercase tracking-wider text-slate-600 mb-0.5 px-2">
                  view / pure
                </div>
                <div className="space-y-0.5">
                  {externalReadFunctions.map((func, index) => (
                    <FunctionItem
                      key={`ext-read-${func.name}-${index}`}
                      func={func}
                      onClick={() => handleFunctionClick(func)}
                      isSelected={selectedFunction === func.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* External Write */}
            {externalWriteFunctions.length > 0 && (
              <div>
                <div className="text-[9px] uppercase tracking-wider text-slate-600 mb-0.5 px-2">
                  state-changing
                </div>
                <div className="space-y-0.5">
                  {externalWriteFunctions.map((func, index) => (
                    <FunctionItem
                      key={`ext-write-${func.name}-${index}`}
                      func={func}
                      onClick={() => handleFunctionClick(func)}
                      isSelected={selectedFunction === func.name}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Internal / Private Section (Collapsible) */}
        {(internalReadFunctions.length > 0 || internalWriteFunctions.length > 0) && (
          <div className="border-t border-navy-500 pt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowInternal(!showInternal);
              }}
              className="w-full text-[10px] uppercase tracking-wider text-lavender/70 font-semibold mb-2 px-2 flex items-center gap-1 hover:text-lavender transition-colors"
            >
              {showInternal ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              <span className="text-lavender">◇</span> Internal / Private
              <span className="text-slate-500 ml-auto">
                ({internalReadFunctions.length + internalWriteFunctions.length})
              </span>
            </button>

            {showInternal && (
              <>
                {/* Internal Read */}
                {internalReadFunctions.length > 0 && (
                  <div className="mb-2">
                    <div className="text-[9px] uppercase tracking-wider text-slate-600 mb-0.5 px-2">
                      view / pure
                    </div>
                    <div className="space-y-0.5">
                      {internalReadFunctions.map((func, index) => (
                        <FunctionItem
                          key={`int-read-${func.name}-${index}`}
                          func={func}
                          onClick={() => handleFunctionClick(func)}
                          isSelected={selectedFunction === func.name}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Internal Write */}
                {internalWriteFunctions.length > 0 && (
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-600 mb-0.5 px-2">
                      state-changing
                    </div>
                    <div className="space-y-0.5">
                      {internalWriteFunctions.map((func, index) => (
                        <FunctionItem
                          key={`int-write-${func.name}-${index}`}
                          func={func}
                          onClick={() => handleFunctionClick(func)}
                          isSelected={selectedFunction === func.name}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Empty State */}
        {contract.externalFunctions.length === 0 && contract.internalFunctions.length === 0 && (
          <div className="text-center text-slate-500 text-xs py-4">
            No functions
          </div>
        )}
      </div>

      {/* Footer with stats */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-mint/10 text-[10px] text-slate-500">
        <span>{contract.externalFunctions.length} ext</span>
        <span>{contract.internalFunctions.length} int</span>
        <span>{contract.events.length} events</span>
      </div>

    </div>
  );
}

export const ContractNode = memo(ContractNodeComponent);
