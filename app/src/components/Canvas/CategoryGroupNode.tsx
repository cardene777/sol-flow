'use client';

import { memo, useMemo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import clsx from 'clsx';
import type { ContractCategory } from '@/types/callGraph';

export interface CategoryGroupNodeData {
  category: ContractCategory;
  subCategory?: string;
  label: string;
  contractCount: number;
  isInsideProxyPattern?: boolean;
}

// Style definition for categories
interface CategoryStyle {
  bg: string;
  borderColor: string;
  textColor: string;
  icon: string;
}

// Preset styles for well-known categories (OpenZeppelin, common patterns)
const PRESET_STYLES: Record<string, CategoryStyle> = {
  // Token categories (hierarchical)
  'token/erc20': { bg: 'rgba(34, 197, 94, 0.15)', borderColor: '#22c55e', textColor: '#4ade80', icon: '🪙' },
  'token/erc721': { bg: 'rgba(59, 130, 246, 0.15)', borderColor: '#3b82f6', textColor: '#60a5fa', icon: '🖼️' },
  'token/erc1155': { bg: 'rgba(168, 85, 247, 0.15)', borderColor: '#a855f7', textColor: '#c084fc', icon: '🎮' },
  'token/erc6909': { bg: 'rgba(236, 72, 153, 0.15)', borderColor: '#ec4899', textColor: '#f472b6', icon: '💎' },
  'token/common': { bg: 'rgba(34, 197, 94, 0.12)', borderColor: '#22c55e', textColor: '#4ade80', icon: '🔗' },
  token: { bg: 'rgba(34, 197, 94, 0.15)', borderColor: '#22c55e', textColor: '#4ade80', icon: '🪙' },
  tokens: { bg: 'rgba(34, 197, 94, 0.15)', borderColor: '#22c55e', textColor: '#4ade80', icon: '🪙' },
  // Proxy categories (hierarchical)
  'proxy/beacon': { bg: 'rgba(6, 182, 212, 0.15)', borderColor: '#06b6d4', textColor: '#22d3ee', icon: '📡' },
  'proxy/transparent': { bg: 'rgba(245, 158, 11, 0.15)', borderColor: '#f59e0b', textColor: '#fbbf24', icon: '🔍' },
  'proxy/erc1967': { bg: 'rgba(139, 92, 246, 0.15)', borderColor: '#8b5cf6', textColor: '#a78bfa', icon: '⬡' },
  'proxy/utils': { bg: 'rgba(245, 158, 11, 0.12)', borderColor: '#f59e0b', textColor: '#fbbf24', icon: '🔧' },
  proxy: { bg: 'rgba(245, 158, 11, 0.15)', borderColor: '#f59e0b', textColor: '#fbbf24', icon: '🔄' },
  // Utils categories (hierarchical)
  'utils/cryptography': { bg: 'rgba(239, 68, 68, 0.15)', borderColor: '#ef4444', textColor: '#f87171', icon: '🔐' },
  'utils/math': { bg: 'rgba(59, 130, 246, 0.15)', borderColor: '#3b82f6', textColor: '#60a5fa', icon: '🔢' },
  'utils/structs': { bg: 'rgba(168, 85, 247, 0.15)', borderColor: '#a855f7', textColor: '#c084fc', icon: '🗃️' },
  'utils/introspection': { bg: 'rgba(6, 182, 212, 0.15)', borderColor: '#06b6d4', textColor: '#22d3ee', icon: '🔎' },
  'utils/types': { bg: 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981', textColor: '#34d399', icon: '📝' },
  utils: { bg: 'rgba(100, 116, 139, 0.15)', borderColor: '#64748b', textColor: '#94a3b8', icon: '🔧' },
  utilities: { bg: 'rgba(100, 116, 139, 0.15)', borderColor: '#64748b', textColor: '#94a3b8', icon: '🔧' },
  // Access categories (hierarchical)
  'access/manager': { bg: 'rgba(59, 130, 246, 0.15)', borderColor: '#3b82f6', textColor: '#60a5fa', icon: '👤' },
  'access/extensions': { bg: 'rgba(59, 130, 246, 0.12)', borderColor: '#3b82f6', textColor: '#60a5fa', icon: '🔌' },
  access: { bg: 'rgba(59, 130, 246, 0.15)', borderColor: '#3b82f6', textColor: '#60a5fa', icon: '🔐' },
  auth: { bg: 'rgba(59, 130, 246, 0.15)', borderColor: '#3b82f6', textColor: '#60a5fa', icon: '🔐' },
  // Governance categories (hierarchical)
  'governance/extensions': { bg: 'rgba(168, 85, 247, 0.12)', borderColor: '#a855f7', textColor: '#c084fc', icon: '🔌' },
  'governance/utils': { bg: 'rgba(168, 85, 247, 0.12)', borderColor: '#a855f7', textColor: '#c084fc', icon: '🔧' },
  governance: { bg: 'rgba(168, 85, 247, 0.15)', borderColor: '#a855f7', textColor: '#c084fc', icon: '🏛️' },
  // Other top-level categories
  account: { bg: 'rgba(6, 182, 212, 0.15)', borderColor: '#06b6d4', textColor: '#22d3ee', icon: '👤' },
  finance: { bg: 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981', textColor: '#34d399', icon: '💰' },
  metatx: { bg: 'rgba(236, 72, 153, 0.15)', borderColor: '#ec4899', textColor: '#f472b6', icon: '📡' },
  crosschain: { bg: 'rgba(249, 115, 22, 0.15)', borderColor: '#f97316', textColor: '#fb923c', icon: '🌐' },
  interface: { bg: 'rgba(99, 102, 241, 0.15)', borderColor: '#6366f1', textColor: '#818cf8', icon: '📋' },
  interfaces: { bg: 'rgba(99, 102, 241, 0.15)', borderColor: '#6366f1', textColor: '#818cf8', icon: '📋' },
  library: { bg: 'rgba(234, 179, 8, 0.15)', borderColor: '#eab308', textColor: '#facc15', icon: '📚' },
  other: { bg: 'rgba(100, 116, 139, 0.15)', borderColor: '#64748b', textColor: '#94a3b8', icon: '📦' },
  // OpenZeppelin categories (with prefix) - legacy
  'openzeppelin/access': { bg: 'rgba(59, 130, 246, 0.15)', borderColor: '#3b82f6', textColor: '#60a5fa', icon: '🔐' },
  'openzeppelin/token': { bg: 'rgba(34, 197, 94, 0.15)', borderColor: '#22c55e', textColor: '#4ade80', icon: '🪙' },
  'openzeppelin/proxy': { bg: 'rgba(245, 158, 11, 0.15)', borderColor: '#f59e0b', textColor: '#fbbf24', icon: '🔄' },
  'openzeppelin/utils': { bg: 'rgba(100, 116, 139, 0.15)', borderColor: '#64748b', textColor: '#94a3b8', icon: '🔧' },
  'openzeppelin/governance': { bg: 'rgba(168, 85, 247, 0.15)', borderColor: '#a855f7', textColor: '#c084fc', icon: '🏛️' },
  'openzeppelin/finance': { bg: 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981', textColor: '#34d399', icon: '💰' },
  'openzeppelin/metatx': { bg: 'rgba(236, 72, 153, 0.15)', borderColor: '#ec4899', textColor: '#f472b6', icon: '📡' },
  'openzeppelin/interfaces': { bg: 'rgba(99, 102, 241, 0.15)', borderColor: '#6366f1', textColor: '#818cf8', icon: '📋' },
  'openzeppelin/vendor': { bg: 'rgba(100, 116, 139, 0.15)', borderColor: '#64748b', textColor: '#94a3b8', icon: '📦' },
  // OZ Upgradeable categories
  'oz-upgradeable/access': { bg: 'rgba(99, 102, 241, 0.15)', borderColor: '#6366f1', textColor: '#818cf8', icon: '🔐' },
  'oz-upgradeable/token': { bg: 'rgba(52, 211, 153, 0.15)', borderColor: '#34d399', textColor: '#6ee7b7', icon: '🪙' },
  'oz-upgradeable/proxy': { bg: 'rgba(251, 191, 36, 0.15)', borderColor: '#fbbf24', textColor: '#fcd34d', icon: '🔄' },
  'oz-upgradeable/utils': { bg: 'rgba(148, 163, 184, 0.15)', borderColor: '#94a3b8', textColor: '#cbd5e1', icon: '🔧' },
  'oz-upgradeable/governance': { bg: 'rgba(192, 132, 252, 0.15)', borderColor: '#c084fc', textColor: '#d8b4fe', icon: '🏛️' },
  // Proxy roles (ERC-7546 and other patterns)
  'proxy-role': { bg: 'rgba(245, 158, 11, 0.15)', borderColor: '#f59e0b', textColor: '#fbbf24', icon: '🔀' },
  'dictionary-role': { bg: 'rgba(6, 182, 212, 0.15)', borderColor: '#06b6d4', textColor: '#22d3ee', icon: '📖' },
  'implementation-role': { bg: 'rgba(168, 85, 247, 0.15)', borderColor: '#a855f7', textColor: '#c084fc', icon: '⚡' },
  'beacon-role': { bg: 'rgba(6, 182, 212, 0.15)', borderColor: '#06b6d4', textColor: '#22d3ee', icon: '📡' },
  'facet-role': { bg: 'rgba(236, 72, 153, 0.15)', borderColor: '#ec4899', textColor: '#f472b6', icon: '💎' },
  'other-role': { bg: 'rgba(100, 116, 139, 0.15)', borderColor: '#64748b', textColor: '#94a3b8', icon: '📦' },
  // Solady categories
  'solady/auth': { bg: 'rgba(234, 179, 8, 0.15)', borderColor: '#eab308', textColor: '#facc15', icon: '🔐' },
  'solady/tokens': { bg: 'rgba(234, 179, 8, 0.15)', borderColor: '#eab308', textColor: '#facc15', icon: '🪙' },
  'solady/utils': { bg: 'rgba(234, 179, 8, 0.15)', borderColor: '#eab308', textColor: '#facc15', icon: '🔧' },
  'solady/accounts': { bg: 'rgba(234, 179, 8, 0.15)', borderColor: '#eab308', textColor: '#facc15', icon: '👤' },
  solady: { bg: 'rgba(234, 179, 8, 0.15)', borderColor: '#eab308', textColor: '#facc15', icon: '⚡' },
};

// Generate a consistent color from a string (for unknown categories)
function stringToColor(str: string): { h: number; s: number; l: number } {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Use golden ratio for better distribution
  const h = Math.abs(hash * 137.508) % 360;
  return { h, s: 65, l: 55 };
}

// Get style for a category (preset or generated)
export function getCategoryStyle(category: string): CategoryStyle {
  const lowerCategory = category.toLowerCase();

  // Check for preset style
  if (PRESET_STYLES[lowerCategory]) {
    return PRESET_STYLES[lowerCategory];
  }

  // Generate color from category name
  const { h, s, l } = stringToColor(category);
  const borderColor = `hsl(${h}, ${s}%, ${l}%)`;
  const textColor = `hsl(${h}, ${s}%, ${l + 15}%)`;
  const bg = `hsla(${h}, ${s}%, ${l}%, 0.15)`;

  // Pick an icon based on first letter or common patterns
  const icons = ['📁', '📂', '🗂️', '💼', '🏷️', '🔷', '🔶', '⬡', '◆', '●'];
  const iconIndex = Math.abs(category.charCodeAt(0)) % icons.length;

  return { bg, borderColor, textColor, icon: icons[iconIndex] };
}

// For backwards compatibility - export categoryStyles as a function that returns styles
export const categoryStyles = new Proxy({} as Record<string, CategoryStyle>, {
  get: (_, prop: string) => getCategoryStyle(prop),
  has: () => true,
});

function CategoryGroupNodeComponent({ data, selected }: NodeProps<CategoryGroupNodeData>) {
  const { category, subCategory, label, contractCount } = data;
  const style = useMemo(() => getCategoryStyle(category), [category]);
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
      <div className="absolute top-0 left-4 -translate-y-1/2 px-4 py-2 bg-navy-800 rounded-xl border-2 border-navy-600 flex items-center gap-3 shadow-lg">
        <span className="text-2xl">{style.icon}</span>
        {isSubCategory && (
          <span className="text-base text-slate-500 font-mono">
            {category} /
          </span>
        )}
        <span className="text-xl font-bold font-mono" style={{ color: style.textColor }}>
          {label}
        </span>
        <span className="text-base text-slate-400 bg-navy-700 px-2 py-1 rounded-lg font-medium">
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
