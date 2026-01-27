'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import clsx from 'clsx';
import { Badge } from '@/components/ui/Badge';
import { FunctionItem } from '@/components/ui/FunctionItem';
import type { LibraryNodeData } from '@/utils/transformToReactFlow';

function LibraryNodeComponent({ data, selected }: NodeProps<LibraryNodeData>) {
  const { contract, isSelected } = data;

  return (
    <div
      className={clsx(
        'library-node min-w-[240px] max-w-[280px] rounded-xl',
        'bg-navy-600/80 border-2 border-dashed border-amber/30',
        'shadow-node',
        (selected || isSelected) && 'border-amber/60 shadow-glow-amber'
      )}
    >
      {/* Handles for edges - with IDs for proper connection */}
      <Handle id="top" type="target" position={Position.Top} className="!bg-amber !w-3 !h-3 !border-2 !border-navy-600" />
      <Handle id="bottom" type="source" position={Position.Bottom} className="!bg-amber !w-3 !h-3 !border-2 !border-navy-600" />
      <Handle id="left" type="target" position={Position.Left} className="!bg-amber !w-3 !h-3 !border-2 !border-navy-600" />
      <Handle id="right" type="source" position={Position.Right} className="!bg-amber !w-3 !h-3 !border-2 !border-navy-600" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-amber/10">
        <div className="flex items-center gap-2">
          <span className="text-amber text-lg">◈</span>
          <span className="font-mono font-semibold text-sm text-slate-100 truncate max-w-[130px]">
            {contract.name}
          </span>
        </div>
        <Badge kind="library" category="library" />
      </div>

      {/* Function List */}
      <div className="p-3 max-h-[200px] overflow-y-auto">
        <div className="space-y-0.5">
          {contract.internalFunctions.slice(0, 8).map((func, index) => (
            <FunctionItem key={`${func.name}-${index}`} func={func} />
          ))}
          {contract.internalFunctions.length > 8 && (
            <div className="text-[10px] text-slate-500 px-2 pt-1">
              +{contract.internalFunctions.length - 8} more
            </div>
          )}
        </div>

        {/* Empty State */}
        {contract.internalFunctions.length === 0 && (
          <div className="text-center text-slate-500 text-xs py-4">
            No functions
          </div>
        )}
      </div>
    </div>
  );
}

export const LibraryNode = memo(LibraryNodeComponent);
