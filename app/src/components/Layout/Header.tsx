'use client';

import { useState, useRef, useEffect } from 'react';
import { Zap, Upload, FolderOpen, Grid3X3, GitBranch, RefreshCw, Download, Image, FileCode, ChevronDown, Pencil, Check, X, Edit3 } from 'lucide-react';
import { SearchBar } from '@/components/Search/SearchBar';
import type { CallGraph } from '@/types/callGraph';
import type { LayoutMode } from '@/utils/transformToReactFlow';

interface HeaderProps {
  callGraph: CallGraph;
  onSelectContract: (name: string) => void;
  onImportClick: () => void;
  onProjectManagerClick: () => void;
  onReload: () => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  onRenameProject?: (newName: string) => void;
  currentProjectId: string | null;
  savedProjectsCount: number;
  layoutMode: LayoutMode;
  onLayoutModeChange: (mode: LayoutMode) => void;
  isEditMode?: boolean;
  onEditModeChange?: (enabled: boolean) => void;
}

export function Header({
  callGraph,
  onSelectContract,
  onImportClick,
  onProjectManagerClick,
  onReload,
  onExportPng,
  onExportSvg,
  onRenameProject,
  currentProjectId,
  savedProjectsCount,
  layoutMode,
  onLayoutModeChange,
  isEditMode = false,
  onEditModeChange,
}: HeaderProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEditing = () => {
    if (currentProjectId && onRenameProject) {
      setEditName(callGraph.projectName);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    if (editName.trim() && onRenameProject) {
      onRenameProject(editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

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
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="text-sm font-display bg-navy-700 border border-navy-500 rounded px-2 py-1 text-slate-100 focus:outline-none focus:border-mint w-[200px]"
              placeholder="Project name"
            />
            <button
              onClick={handleSaveEdit}
              className="p-1 text-mint hover:bg-mint/20 rounded transition-colors"
              title="Save"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancelEdit}
              className="p-1 text-slate-400 hover:bg-slate-500/20 rounded transition-colors"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 group">
            <button
              onClick={onProjectManagerClick}
              className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors"
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
            {currentProjectId && (
              <button
                onClick={handleStartEditing}
                className="p-1 text-slate-500 hover:text-slate-300 hover:bg-navy-700 rounded transition-colors opacity-0 group-hover:opacity-100"
                title="Rename project"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
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

        {/* Edit Mode Toggle - only for user projects */}
        {currentProjectId && onEditModeChange && (
          <button
            onClick={() => onEditModeChange(!isEditMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
              isEditMode
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-navy-700 hover:bg-navy-600 text-slate-300'
            }`}
            title={isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
          >
            <Edit3 className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:block">
              {isEditMode ? 'Editing' : 'Edit'}
            </span>
          </button>
        )}

        {/* Export Dropdown */}
        <div ref={exportMenuRef} className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-700 hover:bg-navy-600 text-slate-300 transition-colors"
            title="Export Diagram"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:block">Export</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-navy-700 border border-navy-600 rounded-lg shadow-xl z-50 py-1">
              <button
                onClick={() => {
                  onExportPng();
                  setShowExportMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-slate-300 hover:bg-navy-600 transition-colors"
              >
                <Image className="w-4 h-4 text-mint" />
                <div>
                  <div className="text-sm font-medium">Export as PNG</div>
                  <div className="text-xs text-slate-500">High-quality image</div>
                </div>
              </button>
              <button
                onClick={() => {
                  onExportSvg();
                  setShowExportMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-slate-300 hover:bg-navy-600 transition-colors"
              >
                <FileCode className="w-4 h-4 text-lavender" />
                <div>
                  <div className="text-sm font-medium">Export as SVG</div>
                  <div className="text-xs text-slate-500">Scalable vector</div>
                </div>
              </button>
            </div>
          )}
        </div>

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
