'use client';

import { memo } from 'react';
import { type NodeProps } from 'reactflow';
import clsx from 'clsx';
import type { ProxyGroupNodeData } from '@/utils/transformToReactFlow';

const patternColors: Record<string, { bg: string; border: string; text: string }> = {
  eip7546: {
    bg: 'bg-emerald-500/5',
    border: 'border-emerald-500/40',
    text: 'text-emerald-400',
  },
  uups: {
    bg: 'bg-blue-500/5',
    border: 'border-blue-500/40',
    text: 'text-blue-400',
  },
  transparent: {
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/40',
    text: 'text-amber-400',
  },
  diamond: {
    bg: 'bg-purple-500/5',
    border: 'border-purple-500/40',
    text: 'text-purple-400',
  },
  beacon: {
    bg: 'bg-cyan-500/5',
    border: 'border-cyan-500/40',
    text: 'text-cyan-400',
  },
};

function ProxyGroupNodeComponent({ data, selected }: NodeProps<ProxyGroupNodeData>) {
  const { group, label } = data;
  const colors = patternColors[group.patternType] || patternColors.eip7546;

  return (
    <div
      className={clsx(
        'w-full h-full rounded-2xl border-2 border-dashed',
        colors.bg,
        colors.border,
        selected && 'ring-2 ring-mint/30'
      )}
    >
      {/* Header */}
      <div className="absolute top-0 left-4 -translate-y-1/2 px-3 py-1 bg-navy-800 rounded-lg border border-navy-600">
        <span className={clsx('text-xs font-medium font-mono', colors.text)}>
          {label}
        </span>
      </div>

      {/* Pattern icon/indicator */}
      <div className="absolute top-2 right-3">
        <span className={clsx('text-lg', colors.text)}>
          {group.patternType === 'diamond' && '◇'}
          {group.patternType === 'eip7546' && '⬡'}
          {group.patternType === 'uups' && '↑'}
          {group.patternType === 'transparent' && '◎'}
          {group.patternType === 'beacon' && '◉'}
        </span>
      </div>
    </div>
  );
}

export const ProxyGroupNode = memo(ProxyGroupNodeComponent);
