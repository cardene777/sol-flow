'use client';

import { memo } from 'react';
import { Trash2 } from 'lucide-react';
import clsx from 'clsx';

interface TempEdgesBadgeProps {
  count: number;
  onClearAll: () => void;
}

function TempEdgesBadgeComponent({ count, onClearAll }: TempEdgesBadgeProps) {
  if (count === 0) return null;

  return (
    <div className={clsx(
      'absolute bottom-4 left-1/2 -translate-x-1/2 z-20',
      'flex items-center gap-3 px-4 py-2',
      'bg-navy-800/95 backdrop-blur-sm border border-red-500/30 rounded-full shadow-lg'
    )}>
      <div className="flex items-center gap-2">
        <div className="w-3 h-0.5 bg-red-400 rounded" style={{ borderStyle: 'dashed' }} />
        <span className="text-sm text-red-400 font-medium">
          一時線: {count}本
        </span>
      </div>
      <button
        onClick={onClearAll}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
      >
        <Trash2 className="w-3 h-3" />
        すべてクリア
      </button>
    </div>
  );
}

export const TempEdgesBadge = memo(TempEdgesBadgeComponent);
