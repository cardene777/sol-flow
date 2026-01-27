import { Zap, Upload, FolderOpen, Grid3X3, GitBranch, RefreshCw } from 'lucide-react';
import { SearchBar } from '@/components/Search/SearchBar';
import type { CallGraph } from '@/types/callGraph';
import type { LayoutMode } from '@/utils/transformToReactFlow';

interface HeaderProps {
  callGraph: CallGraph;
  onSelectContract: (name: string) => void;
  onImportClick: () => void;
  onProjectManagerClick: () => void;
  onReload: () => void;
  currentProjectId: string | null;
  savedProjectsCount: number;
  layoutMode: LayoutMode;
  onLayoutModeChange: (mode: LayoutMode) => void;
}

export function Header({
  callGraph,
  onSelectContract,
  onImportClick,
  onProjectManagerClick,
  onReload,
  currentProjectId,
  savedProjectsCount,
  layoutMode,
  onLayoutModeChange,
}: HeaderProps) {
  return (
    <header className="h-14 bg-navy-800 border-b border-navy-600 flex items-center justify-between px-4">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-mint/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-mint" />
          </div>
          <span className="font-display font-semibold text-lg text-slate-100">
            Sol-Flow
          </span>
        </div>
        <button
          onClick={onProjectManagerClick}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors group"
          title="Manage Projects"
        >
          <span className="text-sm font-display truncate max-w-[200px]">
            {callGraph.projectName}
          </span>
          {currentProjectId && (
            <span className="text-[10px] bg-mint/20 text-mint px-1.5 py-0.5 rounded">
              Saved
            </span>
          )}
        </button>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-xl mx-4">
        <SearchBar callGraph={callGraph} onSelectContract={onSelectContract} />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        {/* Layout Toggle */}
        <div className="flex items-center bg-navy-700 rounded-lg p-0.5">
          <button
            onClick={() => onLayoutModeChange('grid')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm transition-colors ${
              layoutMode === 'grid'
                ? 'bg-navy-600 text-mint'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Grid: カテゴリ内をグリッド配置"
          >
            <Grid3X3 className="w-4 h-4" />
            <span className="hidden sm:block">Grid</span>
          </button>
          <button
            onClick={() => onLayoutModeChange('hierarchy')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm transition-colors ${
              layoutMode === 'hierarchy'
                ? 'bg-navy-600 text-mint'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Hierarchy: カテゴリ内を継承階層で配置"
          >
            <GitBranch className="w-4 h-4" />
            <span className="hidden sm:block">Hierarchy</span>
          </button>
        </div>

        <button
          onClick={onProjectManagerClick}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-700 hover:bg-navy-600 text-slate-300 transition-colors"
          title="Manage Projects"
        >
          <FolderOpen className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:block">Projects</span>
          {savedProjectsCount > 0 && (
            <span className="text-[10px] bg-mint/30 text-mint px-1.5 py-0.5 rounded-full">
              {savedProjectsCount}
            </span>
          )}
        </button>
        <button
          onClick={onReload}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-700 hover:bg-navy-600 text-slate-300 transition-colors"
          title="Reload View"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          onClick={onImportClick}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-mint/20 hover:bg-mint/30 text-mint transition-colors"
          title="Import Contracts"
        >
          <Upload className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:block">Import</span>
        </button>
      </div>
    </header>
  );
}
