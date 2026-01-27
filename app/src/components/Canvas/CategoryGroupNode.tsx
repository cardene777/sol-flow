'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import clsx from 'clsx';
import type { ContractCategory } from '@/types/callGraph';

export interface CategoryGroupNodeData {
  category: ContractCategory | 'proxy-role' | 'dictionary-role';
  subCategory?: string;
  label: string;
  contractCount: number;
  isInsideProxyPattern?: boolean;
}

// Category colors and styles (aligned with OpenZeppelin structure)
// Using hex colors for reliable border rendering
type CategoryStyleKey = ContractCategory | 'proxy-role' | 'dictionary-role';
export const categoryStyles: Record<CategoryStyleKey, { bg: string; borderColor: string; text: string; icon: string }> = {
  access: {
    bg: 'rgba(59, 130, 246, 0.15)',
    borderColor: '#3b82f6',
    text: 'text-blue-400',
    icon: '🔐',
  },
  account: {
    bg: 'rgba(6, 182, 212, 0.15)',
    borderColor: '#06b6d4',
    text: 'text-cyan-400',
    icon: '👤',
  },
  finance: {
    bg: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
    text: 'text-emerald-400',
    icon: '💰',
  },
  governance: {
    bg: 'rgba(168, 85, 247, 0.15)',
    borderColor: '#a855f7',
    text: 'text-purple-400',
    icon: '🏛️',
  },
  metatx: {
    bg: 'rgba(236, 72, 153, 0.15)',
    borderColor: '#ec4899',
    text: 'text-pink-400',
    icon: '📡',
  },
  proxy: {
    bg: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#f59e0b',
    text: 'text-amber-400',
    icon: '🔄',
  },
  'proxy-role': {
    bg: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#f59e0b',
    text: 'text-amber-400',
    icon: '🔀',
  },
  'dictionary-role': {
    bg: 'rgba(168, 85, 247, 0.15)',
    borderColor: '#a855f7',
    text: 'text-purple-400',
    icon: '📖',
  },
  token: {
    bg: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#22c55e',
    text: 'text-green-400',
    icon: '🪙',
  },
  utils: {
    bg: 'rgba(100, 116, 139, 0.15)',
    borderColor: '#64748b',
    text: 'text-slate-300',
    icon: '🔧',
  },
  interface: {
    bg: 'rgba(99, 102, 241, 0.15)',
    borderColor: '#6366f1',
    text: 'text-indigo-400',
    icon: '📋',
  },
  library: {
    bg: 'rgba(234, 179, 8, 0.15)',
    borderColor: '#eab308',
    text: 'text-yellow-400',
    icon: '📚',
  },
  other: {
    bg: 'rgba(100, 116, 139, 0.15)',
    borderColor: '#64748b',
    text: 'text-slate-400',
    icon: '📦',
  },
};

// Human-readable category labels
export const categoryLabels: Record<CategoryStyleKey, string> = {
  access: 'Access Control',
  account: 'Account',
  finance: 'Finance',
  governance: 'Governance',
  metatx: 'Meta Transactions',
  proxy: 'Proxy',
  'proxy-role': 'Proxy',
  'dictionary-role': 'Dictionary',
  token: 'Token',
  utils: 'Utilities',
  interface: 'Interfaces',
  library: 'Libraries',
  other: 'Other',
};

function CategoryGroupNodeComponent({ data, selected }: NodeProps<CategoryGroupNodeData>) {
  const { category, subCategory, label, contractCount } = data;
  const style = categoryStyles[category] || categoryStyles.other;
  const isSubCategory = !!subCategory;

  return (
    <div
      className={clsx(
        'w-full h-full rounded-2xl',
        selected && 'ring-2 ring-white/20'
      )}
      style={{
        minWidth: '100%',
        minHeight: '100%',
        backgroundColor: style.bg,
        border: isSubCategory
          ? `2px dashed ${style.borderColor}`
          : `3px solid ${style.borderColor}`,
      }}
    >
      {/* Header */}
      <div className="absolute top-0 left-3 -translate-y-1/2 px-2 py-0.5 bg-navy-800 rounded border border-navy-600 flex items-center gap-1.5">
        <span className="text-xs">{style.icon}</span>
        {isSubCategory && (
          <span className="text-[9px] text-slate-500 font-mono">
            {categoryLabels[category]} /
          </span>
        )}
        <span className={clsx('text-[10px] font-medium font-mono', style.text)}>
          {label}
        </span>
        <span className="text-[9px] text-slate-500 bg-navy-700 px-1 py-0.5 rounded">
          {contractCount}
        </span>
      </div>

      {/* Handles for edges - both source and target on each side */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!bg-transparent !border-0 !w-3 !h-3"
        style={{ right: -6, top: '50%' }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        className="!bg-transparent !border-0 !w-3 !h-3"
        style={{ right: -6, top: '50%' }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="!bg-transparent !border-0 !w-3 !h-3"
        style={{ left: -6, top: '50%' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="!bg-transparent !border-0 !w-3 !h-3"
        style={{ left: -6, top: '50%' }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="!bg-transparent !border-0 !w-3 !h-3"
        style={{ top: -6, left: '50%' }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        className="!bg-transparent !border-0 !w-3 !h-3"
        style={{ bottom: -6, left: '50%' }}
      />
    </div>
  );
}

export const CategoryGroupNode = memo(CategoryGroupNodeComponent);
