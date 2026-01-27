'use client';

import { useState, useRef, useEffect } from 'react';
import { Zap, Upload, FolderOpen, Grid3X3, GitBranch, RefreshCw, Download, Image, FileCode, ChevronDown, Pencil, Check, X, Search, Menu } from 'lucide-react';
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
}: HeaderProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [isReloading, setIsReloading] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
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
    <>
      <header className="h-14 bg-navy-800 border-b border-navy-600 flex items-center justify-between px-2 sm:px-4">
        {/* Logo & Project Name */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-mint/20 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-mint" />
            </div>
            <span className="font-display font-semibold text-base sm:text-lg text-slate-100 hidden sm:block">
              Sol-Flow
            </span>
          </div>
          {isEditing ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <input
                ref={inputRef}
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="text-sm font-display bg-navy-700 border border-navy-500 rounded px-2 py-1 text-slate-100 focus:outline-none focus:border-mint w-[120px] sm:w-[200px]"
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
            <div className="flex items-center gap-1 sm:gap-1.5 group min-w-0">
              <button
                onClick={onProjectManagerClick}
                className="flex items-center gap-1 sm:gap-1.5 text-slate-400 hover:text-slate-200 transition-colors min-w-0"
                title="Manage Projects"
              >
                <span className="text-xs sm:text-sm font-display truncate max-w-[80px] sm:max-w-[200px]">
                  {callGraph.projectName}
                </span>
                {currentProjectId && (
                  <span className="text-[8px] sm:text-[10px] bg-mint/20 text-mint px-1 sm:px-1.5 py-0.5 rounded flex-shrink-0">
                    Saved
                  </span>
                )}
              </button>
              {currentProjectId && (
                <button
                  onClick={handleStartEditing}
                  className="p-1 text-slate-500 hover:text-slate-300 hover:bg-navy-700 rounded transition-colors opacity-0 group-hover:opacity-100 hidden sm:block"
                  title="Rename project"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Search - Desktop */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <SearchBar callGraph={callGraph} onSelectContract={onSelectContract} />
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Mobile Search Toggle */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="md:hidden flex items-center p-2 rounded-lg bg-navy-700 hover:bg-navy-600 text-slate-300 transition-colors"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Layout Toggle - Hidden on mobile */}
          <div className="hidden sm:flex items-center bg-navy-700 rounded-lg p-0.5">
            <button
              onClick={() => onLayoutModeChange('grid')}
              className={`flex items-center px-2 py-1.5 rounded-md transition-colors ${
                layoutMode === 'grid'
                  ? 'bg-navy-600 text-mint'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Grid: カテゴリ内をグリッド配置"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onLayoutModeChange('hierarchy')}
              className={`flex items-center px-2 py-1.5 rounded-md transition-colors ${
                layoutMode === 'hierarchy'
                  ? 'bg-navy-600 text-mint'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Hierarchy: カテゴリ内を継承階層で配置"
            >
              <GitBranch className="w-4 h-4" />
            </button>
          </div>

          {/* Projects - Hidden on mobile, shown in menu */}
          <button
            onClick={onProjectManagerClick}
            className="hidden sm:flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-navy-700 hover:bg-navy-600 text-slate-300 transition-colors"
            title="Manage Projects"
          >
            <FolderOpen className="w-4 h-4" />
            <span className="text-sm font-medium hidden lg:block">Projects</span>
            {savedProjectsCount > 0 && (
              <span className="text-[10px] bg-mint/30 text-mint px-1.5 py-0.5 rounded-full">
                {savedProjectsCount}
              </span>
            )}
          </button>

          {/* Reload */}
          <button
            onClick={() => {
              setIsReloading(true);
              onReload();
              setTimeout(() => setIsReloading(false), 500);
            }}
            className="flex items-center p-2 sm:px-3 sm:py-1.5 rounded-lg bg-navy-700 hover:bg-navy-600 text-slate-300 transition-colors"
            title="Reload View"
          >
            <RefreshCw className={`w-4 h-4 transition-transform ${isReloading ? 'animate-spin' : ''}`} />
          </button>

          {/* Export Dropdown - Hidden on mobile, shown in menu */}
          <div ref={exportMenuRef} className="relative hidden sm:block">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-navy-700 hover:bg-navy-600 text-slate-300 transition-colors"
              title="Export Diagram"
            >
              <Download className="w-4 h-4" />
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

          {/* Import */}
          <button
            onClick={onImportClick}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-mint/20 hover:bg-mint/30 text-mint transition-colors"
            title="Import Contracts"
          >
            <Upload className="w-4 h-4" />
            <span className="text-sm font-medium hidden lg:block">Import</span>
          </button>

          {/* Mobile Menu Toggle */}
          <div ref={mobileMenuRef} className="relative sm:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="flex items-center p-2 rounded-lg bg-navy-700 hover:bg-navy-600 text-slate-300 transition-colors"
              title="Menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            {showMobileMenu && (
              <div className="absolute right-0 mt-1 w-56 bg-navy-700 border border-navy-600 rounded-lg shadow-xl z-50 py-1">
                {/* Layout Toggle */}
                <div className="px-4 py-2 border-b border-navy-600">
                  <div className="text-xs text-slate-500 mb-2">Layout</div>
                  <div className="flex items-center bg-navy-800 rounded-lg p-0.5">
                    <button
                      onClick={() => {
                        onLayoutModeChange('grid');
                        setShowMobileMenu(false);
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-sm transition-colors ${
                        layoutMode === 'grid'
                          ? 'bg-navy-600 text-mint'
                          : 'text-slate-400'
                      }`}
                    >
                      <Grid3X3 className="w-4 h-4" />
                      Grid
                    </button>
                    <button
                      onClick={() => {
                        onLayoutModeChange('hierarchy');
                        setShowMobileMenu(false);
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-sm transition-colors ${
                        layoutMode === 'hierarchy'
                          ? 'bg-navy-600 text-mint'
                          : 'text-slate-400'
                      }`}
                    >
                      <GitBranch className="w-4 h-4" />
                      Hierarchy
                    </button>
                  </div>
                </div>

                {/* Projects */}
                <button
                  onClick={() => {
                    onProjectManagerClick();
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-slate-300 hover:bg-navy-600 transition-colors"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span className="flex-1">Projects</span>
                  {savedProjectsCount > 0 && (
                    <span className="text-[10px] bg-mint/30 text-mint px-1.5 py-0.5 rounded-full">
                      {savedProjectsCount}
                    </span>
                  )}
                </button>

                {/* Export */}
                <div className="border-t border-navy-600 mt-1 pt-1">
                  <div className="px-4 py-1 text-xs text-slate-500">Export</div>
                  <button
                    onClick={() => {
                      onExportPng();
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-left text-slate-300 hover:bg-navy-600 transition-colors"
                  >
                    <Image className="w-4 h-4 text-mint" />
                    <span>PNG</span>
                  </button>
                  <button
                    onClick={() => {
                      onExportSvg();
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-left text-slate-300 hover:bg-navy-600 transition-colors"
                  >
                    <FileCode className="w-4 h-4 text-lavender" />
                    <span>SVG</span>
                  </button>
                </div>

                {/* Rename (if saved project) */}
                {currentProjectId && onRenameProject && (
                  <div className="border-t border-navy-600 mt-1 pt-1">
                    <button
                      onClick={() => {
                        handleStartEditing();
                        setShowMobileMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-slate-300 hover:bg-navy-600 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                      <span>Rename Project</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Search Bar - Expandable */}
      {showMobileSearch && (
        <div className="md:hidden bg-navy-800 border-b border-navy-600 px-2 py-2">
          <SearchBar callGraph={callGraph} onSelectContract={(name) => {
            onSelectContract(name);
            setShowMobileSearch(false);
          }} />
        </div>
      )}
    </>
  );
}
