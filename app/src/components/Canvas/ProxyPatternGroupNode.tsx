'use client';

import { memo } from 'react';
import type { NodeProps } from 'reactflow';
import clsx from 'clsx';
import type { ProxyPatternType } from '@/types/callGraph';
import type { ProxyPatternGroupNodeData } from '@/utils/transformToReactFlow';

export type { ProxyPatternGroupNodeData };

const PATTERN_STYLES: Record<ProxyPatternType, {
  borderColor: string;
  bgColor: string;
  textColor: string;
  icon: string;
}> = {
  eip7546: {
    borderColor: 'border-emerald-500/70',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    icon: '📖',
  },
  uups: {
    borderColor: 'border-blue-500/60',
    bgColor: 'bg-blue-500/5',
    textColor: 'text-blue-400',
    icon: '🔄',
  },
  transparent: {
    borderColor: 'border-amber-500/60',
    bgColor: 'bg-amber-500/5',
    textColor: 'text-amber-400',
    icon: '🔍',
  },
  diamond: {
    borderColor: 'border-purple-500/60',
    bgColor: 'bg-purple-500/5',
    textColor: 'text-purple-400',
    icon: '💎',
  },
  beacon: {
    borderColor: 'border-cyan-500/60',
    bgColor: 'bg-cyan-500/5',
    textColor: 'text-cyan-400',
    icon: '📡',
  },
};

const PATTERN_LABELS: Record<ProxyPatternType, string> = {
  eip7546: 'ERC-7546',
  uups: 'UUPS',
  transparent: 'Transparent Proxy',
  diamond: 'Diamond (EIP-2535)',
  beacon: 'Beacon Proxy',
};

function ProxyPatternGroupNodeComponent({ data }: NodeProps<ProxyPatternGroupNodeData>) {
  const { patternType, contractCount } = data;
  const style = PATTERN_STYLES[patternType];
  const label = PATTERN_LABELS[patternType];

  return (
    <div
      className={clsx(
        'rounded-2xl border-3 border-dashed',
        style.borderColor,
        style.bgColor,
        'pointer-events-none'
      )}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Header - Large and prominent */}
      <div className={clsx(
        'absolute -top-4 left-6 px-5 py-2 rounded-xl',
        'bg-navy-800 border-2 shadow-lg',
        style.borderColor
      )}>
        <span className={clsx('text-2xl mr-2')}>{style.icon}</span>
        <span className={clsx(
          'text-lg font-bold tracking-wide',
          style.textColor
        )}>
          {label}
        </span>
        <span className="ml-3 text-sm text-slate-500">
          {contractCount} contracts
        </span>
      </div>
    </div>
  );
}

export const ProxyPatternGroupNode = memo(ProxyPatternGroupNodeComponent);
