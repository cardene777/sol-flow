import { X, ArrowRight, Zap, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import type { ExternalFunction, Contract } from '../../types/callGraph';

interface FunctionDetailPanelProps {
  func: ExternalFunction;
  contract: Contract;
  onClose: () => void;
}

export function FunctionDetailPanel({ func, contract, onClose }: FunctionDetailPanelProps) {
  const isView = func.stateMutability === 'view' || func.stateMutability === 'pure';

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[600px] max-w-[calc(100%-2rem)] bg-navy-700 border border-navy-500 rounded-xl shadow-2xl z-50 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-navy-500">
        <div className="flex items-center gap-3">
          <span className={clsx('text-lg', isView ? 'text-mint' : 'text-coral')}>
            {isView ? '○' : '●'}
          </span>
          <div>
            <h3 className="font-mono font-semibold text-slate-100">
              {contract.name}.{func.name}()
            </h3>
            <p className="text-xs text-slate-500 font-mono">{func.selector}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-navy-500 rounded transition-colors"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Signature */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
            Signature
          </div>
          <code className="block bg-navy-800 rounded px-3 py-2 text-sm font-mono text-slate-200 overflow-x-auto">
            {func.signature}
          </code>
        </div>

        {/* Parameters & Returns */}
        <div className="grid grid-cols-2 gap-4">
          {/* Parameters */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">
              Parameters
            </div>
            {func.parameters.length > 0 ? (
              <div className="space-y-1">
                {func.parameters.map((param, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="text-lavender font-mono">{param.type}</span>
                    <span className="text-slate-400">{param.name || `arg${i}`}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-xs text-slate-500">None</span>
            )}
          </div>

          {/* Return Values */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">
              Returns
            </div>
            {func.returnValues.length > 0 ? (
              <div className="space-y-1">
                {func.returnValues.map((ret, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="text-mint font-mono">{ret.type}</span>
                    {ret.name && <span className="text-slate-400">{ret.name}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-xs text-slate-500">void</span>
            )}
          </div>
        </div>

        {/* Internal Calls */}
        {func.calls.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">
              Internal Calls
            </div>
            <div className="flex flex-wrap gap-2">
              {func.calls.map((call, i) => (
                <div
                  key={i}
                  className={clsx(
                    'flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono',
                    call.type === 'library' && 'bg-amber/10 text-amber border border-amber/20',
                    call.type === 'internal' && 'bg-lavender/10 text-lavender border border-lavender/20',
                    call.type === 'external' && 'bg-mint/10 text-mint border border-mint/20'
                  )}
                >
                  <ArrowRight className="w-3 h-3" />
                  {call.target}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Events & Modifiers */}
        <div className="flex gap-4">
          {/* Events */}
          {func.emits.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">
                Events
              </div>
              <div className="flex flex-wrap gap-1">
                {func.emits.map((event, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 px-2 py-0.5 bg-coral/10 text-coral border border-coral/20 rounded text-xs font-mono"
                  >
                    <Zap className="w-3 h-3" />
                    {event}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Modifiers */}
          {func.modifiers.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">
                Modifiers
              </div>
              <div className="flex flex-wrap gap-1">
                {func.modifiers.map((mod, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 px-2 py-0.5 bg-amber/10 text-amber border border-amber/20 rounded text-xs font-mono"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {mod}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* State Mutability */}
        <div className="flex items-center gap-4 pt-2 border-t border-navy-500">
          <span
            className={clsx(
              'px-2 py-0.5 rounded text-xs font-medium',
              func.stateMutability === 'view' && 'bg-mint/10 text-mint',
              func.stateMutability === 'pure' && 'bg-blue-500/10 text-blue-400',
              func.stateMutability === 'nonpayable' && 'bg-slate-500/10 text-slate-400',
              func.stateMutability === 'payable' && 'bg-amber/10 text-amber'
            )}
          >
            {func.stateMutability}
          </span>
          <span className="text-xs text-slate-500">
            {func.visibility}
          </span>
          {func.isVirtual && (
            <span className="text-xs text-indigo-400">virtual</span>
          )}
        </div>
      </div>
    </div>
  );
}
