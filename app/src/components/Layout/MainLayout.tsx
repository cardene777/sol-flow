'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Edit3, PanelLeft, X } from 'lucide-react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { DiagramCanvas, type DiagramCanvasHandle, type TempEdge } from '@/components/Canvas/DiagramCanvas';
import { FunctionFlowModal } from '@/components/FunctionFlow/FunctionFlowModal';
import type { CallGraph, ExternalFunction, ContractCategory, UserEdge } from '@/types/callGraph';
import type { LayoutMode } from '@/utils/transformToReactFlow';

interface MainLayoutProps {
  callGraph: CallGraph;
  selectedContract: string | null;
  selectedFunction: ExternalFunction | null;
  onSelectContract: (name: string | null) => void;
  onSelectFunction: (func: ExternalFunction | null) => void;
  onImportClick: () => void;
  onProjectManagerClick: () => void;
  onReload: () => void;
  onRenameProject?: (newName: string) => void;
  onNavigateToLanding?: () => void;
  currentProjectId: string | null;
  currentLibraryId: string | null;
  savedProjectsCount: number;
  // Edit mode
  isEditMode?: boolean;
  onEditModeChange?: (enabled: boolean) => void;
  tempEdges?: TempEdge[];
  onAddTempEdge?: (edge: TempEdge) => void;
  onClearTempEdges?: () => void;
  onAddUserEdge?: (edge: UserEdge) => void;
  onDeleteEdge?: (edgeId: string) => void;
}

export function MainLayout({
  callGraph,
  selectedContract,
  selectedFunction,
  onSelectContract,
  onSelectFunction,
  onImportClick,
  onProjectManagerClick,
  onReload,
  onRenameProject,
  onNavigateToLanding,
  currentProjectId,
  currentLibraryId,
  savedProjectsCount,
  isEditMode = false,
  onEditModeChange,
  tempEdges = [],
  onAddTempEdge,
  onClearTempEdges,
  onAddUserEdge,
  onDeleteEdge,
}: MainLayoutProps) {
  // Generate a unique key for the canvas to force re-render when project/library changes
  const canvasKey = currentProjectId || currentLibraryId || 'default';

  // Ref for diagram canvas export functions
  const diagramRef = useRef<DiagramCanvasHandle>(null);

  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Export handlers
  const handleExportPng = useCallback(() => {
    diagramRef.current?.exportAsPng();
  }, []);

  const handleExportSvg = useCallback(() => {
    diagramRef.current?.exportAsSvg();
  }, []);

  // Category filter state (undefined = show all)
  const [visibleCategories, setVisibleCategories] = useState<ContractCategory[] | undefined>(undefined);

  // Layout mode state (default to hierarchy for better visualization)
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('hierarchy');

  const handleCategoryToggle = useCallback((category: ContractCategory) => {
    setVisibleCategories((prev) => {
      // If showing all (undefined), start with all categories then remove this one
      if (!prev) {
        const allCategories: ContractCategory[] = ['access', 'account', 'finance', 'governance', 'metatx', 'proxy', 'token', 'utils', 'interface', 'library', 'other'];
        return allCategories.filter((c) => c !== category);
      }
      // If this category is visible, remove it
      if (prev.includes(category)) {
        const newCategories = prev.filter((c) => c !== category);
        // If all would be hidden, show all instead
        return newCategories.length === 0 ? undefined : newCategories;
      }
      // Otherwise add it
      const newCategories = [...prev, category];
      // If all categories would be visible, show all (undefined)
      const allCategories: ContractCategory[] = ['access', 'account', 'finance', 'governance', 'metatx', 'proxy', 'token', 'utils', 'interface', 'library', 'other'];
      return newCategories.length >= allCategories.length ? undefined : newCategories;
    });
  }, []);

  // Find the contract for the selected function
  const selectedContractData = selectedContract
    ? callGraph.contracts.find((c) => c.name === selectedContract)
    : null;

  return (
    <div className="h-screen w-screen flex flex-col bg-navy-900">
      {/* Header */}
      <Header
        callGraph={callGraph}
        onSelectContract={(name) => {
          onSelectContract(name);
          onSelectFunction(null);
        }}
        onImportClick={onImportClick}
        onProjectManagerClick={onProjectManagerClick}
        onReload={onReload}
        onExportPng={handleExportPng}
        onExportSvg={handleExportSvg}
        onRenameProject={onRenameProject}
        onNavigateToLanding={onNavigateToLanding}
        currentProjectId={currentProjectId}
        savedProjectsCount={savedProjectsCount}
        layoutMode={layoutMode}
        onLayoutModeChange={setLayoutMode}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Desktop: always visible, Mobile: slide-in drawer */}
        <div
          className={`
            fixed md:relative inset-y-0 left-0 z-40 md:z-0
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          {/* Mobile close button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden absolute top-2 right-2 z-50 p-1.5 rounded-lg bg-navy-700 hover:bg-navy-600 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
          <Sidebar
            callGraph={callGraph}
            selectedContract={selectedContract}
            onSelectContract={(name) => {
              onSelectContract(name);
              onSelectFunction(null);
              setSidebarOpen(false); // Close sidebar on mobile after selection
            }}
            visibleCategories={visibleCategories}
            onCategoryToggle={handleCategoryToggle}
          />
        </div>

        {/* Canvas */}
        <main data-tour="canvas" className="flex-1 overflow-hidden relative">
          <DiagramCanvas
            key={canvasKey}
            ref={diagramRef}
            callGraph={callGraph}
            selectedContract={selectedContract}
            selectedFunction={selectedFunction?.name ?? null}
            onSelectContract={onSelectContract}
            onSelectFunction={onSelectFunction}
            enableCategoryGroups={true}
            visibleCategories={visibleCategories}
            layoutMode={layoutMode}
            isEditMode={isEditMode}
            isLibrary={!!currentLibraryId}
            tempEdges={tempEdges}
            onAddTempEdge={onAddTempEdge}
            onClearTempEdges={onClearTempEdges}
            onAddUserEdge={onAddUserEdge}
            onDeleteEdge={onDeleteEdge}
          />

          {/* Mobile Sidebar Toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden absolute top-4 left-4 z-10 flex items-center p-2 rounded-lg bg-navy-700 hover:bg-navy-600 text-slate-300 transition-colors"
            title="Open Sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          {/* Edit Mode Toggle - only for user projects */}
          {currentProjectId && onEditModeChange && (
            <button
              onClick={() => onEditModeChange(!isEditMode)}
              className={`absolute top-4 right-4 z-10 flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg transition-colors ${
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
        </main>
      </div>

      {/* Function Flow Modal */}
      {selectedFunction && selectedContractData && (
        <FunctionFlowModal
          func={selectedFunction}
          contract={selectedContractData}
          callGraph={callGraph}
          onClose={() => onSelectFunction(null)}
        />
      )}
    </div>
  );
}
