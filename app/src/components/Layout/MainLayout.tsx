'use client';

import { useState, useCallback } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { DiagramCanvas } from '@/components/Canvas/DiagramCanvas';
import { FunctionFlowModal } from '@/components/FunctionFlow/FunctionFlowModal';
import type { CallGraph, ExternalFunction, ContractCategory } from '@/types/callGraph';
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
  currentProjectId: string | null;
  savedProjectsCount: number;
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
  currentProjectId,
  savedProjectsCount,
}: MainLayoutProps) {
  // Category filter state (undefined = show all)
  const [visibleCategories, setVisibleCategories] = useState<ContractCategory[] | undefined>(undefined);

  // Layout mode state
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');

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
        currentProjectId={currentProjectId}
        savedProjectsCount={savedProjectsCount}
        layoutMode={layoutMode}
        onLayoutModeChange={setLayoutMode}
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
            callGraph={callGraph}
            selectedContract={selectedContract}
            selectedFunction={selectedFunction?.name ?? null}
            onSelectContract={onSelectContract}
            onSelectFunction={onSelectFunction}
            enableCategoryGroups={true}
            visibleCategories={visibleCategories}
            layoutMode={layoutMode}
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
