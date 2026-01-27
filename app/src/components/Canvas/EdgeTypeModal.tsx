'use client';

import { memo, useState } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';
import type { DependencyType } from '@/types/callGraph';

interface EdgeTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: DependencyType) => void;
  fromContract: string;
  toContract: string;
  isTemporary: boolean;
}

const EDGE_TYPES: { type: DependencyType; label: string; description: string; color: string }[] = [
  { type: 'inherits', label: 'Inherits', description: '継承関係', color: 'text-blue-400' },
  { type: 'implements', label: 'Implements', description: 'インターフェース実装', color: 'text-indigo-400' },
  { type: 'uses', label: 'Uses', description: 'ライブラリ使用', color: 'text-amber-400' },
  { type: 'delegatecall', label: 'Delegatecall', description: '委任呼び出し', color: 'text-pink-400' },
  { type: 'registers', label: 'Registers', description: '実装登録', color: 'text-purple-400' },
];

function EdgeTypeModalComponent({
  isOpen,
  onClose,
  onSelect,
  fromContract,
  toContract,
  isTemporary,
}: EdgeTypeModalProps) {
  const [selectedType, setSelectedType] = useState<DependencyType>('uses');

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSelect(selectedType);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-navy-800 border border-navy-600 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-600">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {isTemporary ? '一時線を追加' : '線を追加'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {fromContract} → {toContract}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-navy-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isTemporary && (
            <div className="mb-4 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-xs text-red-400">
                一時線はリロードすると消えます
              </p>
            </div>
          )}

          <div className="space-y-2">
            {EDGE_TYPES.map(({ type, label, description, color }) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left',
                  selectedType === type
                    ? 'bg-mint/10 border-mint/30 text-white'
                    : 'bg-navy-700/50 border-navy-600 text-slate-300 hover:bg-navy-700 hover:border-navy-500'
                )}
              >
                <div className={clsx('w-3 h-3 rounded-full', selectedType === type ? 'bg-mint' : 'bg-navy-500')} />
                <div className="flex-1">
                  <span className={clsx('font-medium', color)}>{label}</span>
                  <span className="text-slate-500 text-sm ml-2">- {description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-navy-600 bg-navy-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-navy-700 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            className={clsx(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              isTemporary
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-mint hover:bg-mint/90 text-navy-900'
            )}
          >
            追加
          </button>
        </div>
      </div>
    </div>
  );
}

export const EdgeTypeModal = memo(EdgeTypeModalComponent);
