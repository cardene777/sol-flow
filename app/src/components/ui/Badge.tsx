import clsx from 'clsx';
import type { ContractCategory, ContractKind } from '@/types/callGraph';

interface BadgeProps {
  category?: ContractCategory;
  kind?: ContractKind;
  className?: string;
}

const categoryColors: Record<ContractCategory, string> = {
  access: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  account: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  finance: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  governance: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  metatx: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  proxy: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  token: 'bg-green-500/20 text-green-400 border-green-500/30',
  utils: 'bg-slate-500/20 text-slate-300 border-slate-400/30',
  interface: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  library: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  other: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const kindLabels: Record<ContractKind, string> = {
  contract: 'contract',
  library: 'library',
  interface: 'interface',
  abstract: 'abstract',
};

export function Badge({ category, kind, className }: BadgeProps) {
  const label = kind ? kindLabels[kind] : category;
  const colorClass = category
    ? categoryColors[category]
    : 'bg-slate-500/20 text-slate-400 border-slate-500/30';

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium font-display border',
        colorClass,
        className
      )}
    >
      {label}
    </span>
  );
}
