'use client';

import { useState, useCallback, useRef } from 'react';
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
        currentProjectId={currentProjectId}
        savedProjectsCount={savedProjectsCount}
        layoutMode={layoutMode}
        onLayoutModeChange={setLayoutMode}
        isEditMode={isEditMode}
        onEditModeChange={onEditModeChange}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          callGraph={callGraph}
          selectedContract={selectedContract}
          onSelectContract={(name) => {
            onSelectContract(name);
            onSelectFunction(null);
          }}
          visibleCategories={visibleCategories}
          onCategoryToggle={handleCategoryToggle}
        />

        {/* Canvas */}
        <main className="flex-1 overflow-hidden relative">
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
