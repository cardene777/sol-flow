import { useMemo } from 'react';
import clsx from 'clsx';
import type { ContractCategory, ContractKind } from '@/types/callGraph';
import { getCategoryStyle } from '@/components/Canvas/CategoryGroupNode';

interface BadgeProps {
  category?: ContractCategory;
  kind?: ContractKind;
  className?: string;
}

const kindLabels: Record<ContractKind, string> = {
  contract: 'contract',
  library: 'library',
  interface: 'interface',
  abstract: 'abstract',
};

export function Badge({ category, kind, className }: BadgeProps) {
  const label = kind ? kindLabels[kind] : category;

  // Get dynamic color for category
  const style = useMemo(() => {
    if (!category) return null;
    return getCategoryStyle(category);
  }, [category]);

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium font-display border',
        !style && 'bg-slate-500/20 text-slate-400 border-slate-500/30',
        className
      )}
      style={style ? {
        backgroundColor: style.bg,
        color: style.textColor,
        borderColor: style.borderColor,
      } : undefined}
    >
      {label}
    </span>
  );
}
