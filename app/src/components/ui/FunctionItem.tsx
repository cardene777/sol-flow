import clsx from 'clsx';
import type { ExternalFunction, InternalFunction } from '@/types/callGraph';

interface FunctionItemProps {
  func: ExternalFunction | InternalFunction;
  onClick?: () => void;
  isSelected?: boolean;
}

export function FunctionItem({ func, onClick, isSelected }: FunctionItemProps) {
  const isView = func.stateMutability === 'view' || func.stateMutability === 'pure';
  const isExternal = 'visibility' in func && (func.visibility === 'external' || func.visibility === 'public');

  // Format parameters for display
  const params = func.parameters
    .map((p) => p.type)
    .join(', ');

  // Truncate if too long
  const displayName = func.name.length > 20 ? func.name.slice(0, 17) + '...' : func.name;
  const displayParams = params.length > 15 ? params.slice(0, 12) + '...' : params;

  const handleClick = (e: React.MouseEvent) => {
    // Stop all event propagation
    e.stopPropagation();
    e.preventDefault();
    console.log('FunctionItem clicked:', func.name);
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.stopPropagation();
          onClick?.();
        }
      }}
      className={clsx(
        'nodrag nowheel nopan',
        'function-item w-full flex items-center gap-2 px-2 py-2 rounded text-left',
        'hover:bg-navy-500/50 transition-colors cursor-pointer select-none',
        isSelected && 'bg-navy-500/70 ring-1 ring-mint/50'
      )}
      style={{ pointerEvents: 'all' }}
    >
      {/* Visibility Icon */}
      <span
        className={clsx(
          'flex-shrink-0 text-sm pointer-events-none',
          isExternal
            ? (isView ? 'text-mint' : 'text-coral')
            : (isView ? 'text-lavender' : 'text-coral')
        )}
      >
        {isExternal ? (isView ? '○' : '●') : (isView ? '◇' : '◆')}
      </span>

      {/* Function Name */}
      <span className="font-mono text-xs text-slate-200 truncate pointer-events-none">
        {displayName}
        <span className="text-slate-500">({displayParams})</span>
      </span>

      {/* Modifiers indicator */}
      {'modifiers' in func && func.modifiers.length > 0 && (
        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber pointer-events-none" title={func.modifiers.join(', ')} />
      )}
    </div>
  );
}
