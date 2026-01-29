'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/Layout/MainLayout';
import { UploadModal } from '@/components/Upload/UploadModal';
import { ProjectManager, type LibraryId } from '@/components/Projects/ProjectManager';
import { OnboardingTour } from '@/components/Onboarding/OnboardingTour';
import type { CallGraph, ExternalFunction, UserEdge } from '@/types/callGraph';
import type { TempEdge } from '@/components/Canvas/DiagramCanvas';
import {
  getSavedProjects,
  saveProject,
  loadProject,
  loadProjectSources,
  deleteProject,
  renameProject,
  updateProjectCallGraph,
  type SavedProject,
  type SourceFile,
} from '@/lib/storage';
import { STORAGE_KEYS } from '@/constants';

// Empty initial state
const emptyCallGraph: CallGraph = {
  version: '1.0.0',
  generatedAt: new Date().toISOString(),
  projectName: 'Loading...',
  structure: { name: 'root', type: 'directory', path: '/', children: [] },
  contracts: [],
  dependencies: [],
  proxyGroups: [],
  stats: {
    totalContracts: 0,
    totalInterfaces: 0,
    totalLibraries: 0,
    totalFunctions: 0,
  },
};

export default function AppPage() {
  const router = useRouter();
  const [callGraph, setCallGraph] = useState<CallGraph>(emptyCallGraph);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentLibraryId, setCurrentLibraryId] = useState<LibraryId | null>('openzeppelin');
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const [selectedFunction, setSelectedFunction] = useState<ExternalFunction | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [tempEdges, setTempEdges] = useState<TempEdge[]>([]);
  // Show library contracts toggle (for samples with merged libraries)
  const [showLibraryContracts, setShowLibraryContracts] = useState(false);
  // Reload key to force complete re-render
  const [reloadKey, setReloadKey] = useState(0);
  // Onboarding tour state
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if this is first visit to app page
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
    if (!hasCompletedOnboarding) {
      // Small delay to let the UI render first
      setTimeout(() => setShowOnboarding(true), 500);
    }
  }, []);

  // Load saved projects list and current project
  useEffect(() => {
    async function loadInitialData() {
      try {
        // Load saved projects list
        const projects = getSavedProjects();
        setSavedProjects(projects);

        // Check for last opened project
        const lastProjectId = localStorage.getItem(STORAGE_KEYS.CURRENT_PROJECT);
        if (lastProjectId) {
          const savedCallGraph = loadProject(lastProjectId);
          if (savedCallGraph) {
            setCallGraph(savedCallGraph);
            setCurrentProjectId(lastProjectId);
            setCurrentLibraryId(null);
            setIsLoading(false);
            return;
          }
        }

        // Check for last selected library (default to openzeppelin)
        let lastLibraryId = (localStorage.getItem(STORAGE_KEYS.CURRENT_LIBRARY) || 'openzeppelin') as LibraryId;
        let response = await fetch(`/api/libraries/${lastLibraryId}`);

        // Fallback to openzeppelin if the saved library doesn't exist
        if (!response.ok && lastLibraryId !== 'openzeppelin') {
          // Warning:(`Library ${lastLibraryId} not found, falling back to openzeppelin`);
          lastLibraryId = 'openzeppelin';
          localStorage.setItem(STORAGE_KEYS.CURRENT_LIBRARY, 'openzeppelin');
          response = await fetch(`/api/libraries/openzeppelin`);
        }

        if (response.ok) {
          const data = await response.json();
          setCallGraph(data.callGraph);
          setCurrentProjectId(null);
          setCurrentLibraryId(lastLibraryId);
        }
      } catch (e) {
        // Error:('Failed to load initial data:', e);
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, []);

  // Handle importing new project
  const handleImport = useCallback((newCallGraph: CallGraph, sourceFiles?: SourceFile[]) => {
    setCallGraph(newCallGraph);
    setSelectedContract(null);
    setSelectedFunction(null);

    // Save to localStorage as new project (with source files for re-parsing)
    try {
      const project = saveProject(newCallGraph.projectName, newCallGraph, sourceFiles);
      setCurrentProjectId(project.id);
      setCurrentLibraryId(null);
      setSavedProjects(getSavedProjects());
      localStorage.setItem(STORAGE_KEYS.CURRENT_PROJECT, project.id);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_LIBRARY);
    } catch (e) {
      // Error:('Failed to save project:', e);
    }

    // Increment reload key to force complete re-render
    setReloadKey(prev => prev + 1);
  }, []);

  // Switch to a different saved project
  const handleSwitchProject = useCallback((projectId: string) => {
    const savedCallGraph = loadProject(projectId);
    if (savedCallGraph) {
      setCallGraph(savedCallGraph);
      setCurrentProjectId(projectId);
      setCurrentLibraryId(null);
      setSelectedContract(null);
      setSelectedFunction(null);
      setIsEditMode(false);
      setTempEdges([]);
      localStorage.setItem(STORAGE_KEYS.CURRENT_PROJECT, projectId);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_LIBRARY);
    }
    setShowProjectManager(false);
  }, []);

  // Delete a saved project
  const handleDeleteProject = useCallback((projectId: string) => {
    deleteProject(projectId);
    setSavedProjects(getSavedProjects());

    // If deleted current project, load default library
    if (projectId === currentProjectId) {
      setCurrentProjectId(null);
      setCurrentLibraryId('openzeppelin');
      localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT);
      localStorage.setItem(STORAGE_KEYS.CURRENT_LIBRARY, 'openzeppelin');
      fetch('/api/libraries/openzeppelin')
        .then(res => res.json())
        .then(data => setCallGraph(data.callGraph))
        .catch(() => { /* ignore */ });
    }
  }, [currentProjectId]);

  // Rename the current project
  const handleRenameProject = useCallback((newName: string) => {
    if (!currentProjectId) return;

    if (renameProject(currentProjectId, newName)) {
      // Update local state
      setCallGraph(prev => ({ ...prev, projectName: newName }));
      setSavedProjects(getSavedProjects());
    }
  }, [currentProjectId]);

  const handleSelectContract = useCallback((name: string | null) => {
    setSelectedContract(name);
  }, []);

  const handleSelectFunction = useCallback((func: ExternalFunction | null) => {
    setSelectedFunction(func);
  }, []);

  const handleImportClick = useCallback(() => {
    setShowUploadModal(true);
  }, []);

  const handleProjectManagerClick = useCallback(() => {
    setShowProjectManager(true);
  }, []);

  // Reload/Reset current view
  // For libraries: re-fetch from API
  // For user projects: re-parse from saved source files
  const handleReload = useCallback(async () => {
    setSelectedContract(null);
    setSelectedFunction(null);
    setTempEdges([]);

    try {
      if (currentProjectId) {
        // For user projects: re-parse from saved source files
        const sourceFiles = loadProjectSources(currentProjectId);
        if (sourceFiles && sourceFiles.length > 0) {
          const savedProject = getSavedProjects().find(p => p.id === currentProjectId);
          const projectName = savedProject?.name || callGraph.projectName;

          const response = await fetch('/api/parse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectName, files: sourceFiles }),
          });

          if (response.ok) {
            const data = await response.json();
            setCallGraph(data.callGraph);
            // Update saved project with new callGraph
            updateProjectCallGraph(currentProjectId, data.callGraph);
          }
        } else {
          // No source files saved (old project), just reload from storage
          const savedCallGraph = loadProject(currentProjectId);
          if (savedCallGraph) {
            setCallGraph(savedCallGraph);
          }
        }
      } else if (currentLibraryId) {
        // For libraries: re-fetch from API
        const response = await fetch(`/api/libraries/${currentLibraryId}`);
        if (response.ok) {
          const data = await response.json();
          setCallGraph(data.callGraph);
        }
      }
    } catch (e) {
      // Error:('Failed to reload:', e);
    }

    // Increment reload key to force complete re-render of canvas
    setReloadKey(prev => prev + 1);
  }, [currentLibraryId, currentProjectId, callGraph.projectName]);

  // Edit mode handlers
  const handleEditModeChange = useCallback((enabled: boolean) => {
    setIsEditMode(enabled);
  }, []);

  const handleAddTempEdge = useCallback((edge: TempEdge) => {
    setTempEdges(prev => [...prev, edge]);
  }, []);

  const handleClearTempEdges = useCallback(() => {
    setTempEdges([]);
  }, []);

  const handleAddUserEdge = useCallback((edge: UserEdge) => {
    if (!currentProjectId) return;

    setCallGraph(prev => {
      const newCallGraph = {
        ...prev,
        userEdges: [...(prev.userEdges || []), edge],
      };
      // Save to localStorage
      updateProjectCallGraph(currentProjectId, newCallGraph);
      return newCallGraph;
    });
  }, [currentProjectId]);

  const handleDeleteEdge = useCallback((edgeId: string) => {
    // Temp edges can be deleted anytime (even for libraries)
    if (edgeId.startsWith('temp-')) {
      const actualId = edgeId.replace('temp-', '');
      setTempEdges(prev => prev.filter(e => e.id !== actualId));
      return;
    }

    // Other edge operations require a user project
    if (!currentProjectId) return;

    // Check if it's a user edge
    if (edgeId.startsWith('user-')) {
      setCallGraph(prev => {
        const newCallGraph = {
          ...prev,
          userEdges: (prev.userEdges || []).filter(e => e.id !== edgeId),
        };
        updateProjectCallGraph(currentProjectId, newCallGraph);
        return newCallGraph;
      });
      return;
    }

    // It's a system edge - add to deleted list
    setCallGraph(prev => {
      const newCallGraph = {
        ...prev,
        deletedEdgeIds: [...(prev.deletedEdgeIds || []), edgeId],
      };
      updateProjectCallGraph(currentProjectId, newCallGraph);
      return newCallGraph;
    });
  }, [currentProjectId]);

  // Navigate to landing page
  const handleNavigateToLanding = useCallback(() => {
    router.push('/');
  }, [router]);

  const handleOnboardingComplete = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
    setShowOnboarding(false);
  }, []);

  const handleOnboardingSkip = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
    setShowOnboarding(false);
  }, []);

  // Load a built-in library
  const handleLoadLibrary = useCallback(async (libraryId: LibraryId) => {
    // Clear selection state
    setSelectedContract(null);
    setSelectedFunction(null);
    setCurrentProjectId(null);
    setCurrentLibraryId(libraryId);
    setIsEditMode(false);
    setTempEdges([]);

    // Update localStorage
    localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT);
    localStorage.setItem(STORAGE_KEYS.CURRENT_LIBRARY, libraryId);

    // Set a loading state by updating the callGraph projectName
    setCallGraph(prev => ({
      ...prev,
      projectName: 'Loading...',
    }));

    try {
      const response = await fetch(`/api/libraries/${libraryId}`);
      if (response.ok) {
        const data = await response.json();
        setCallGraph(data.callGraph);
      } else {
        // Error:('Failed to load library: Response not OK', response.status);
      }
    } catch (e) {
      // Error:('Failed to load library:', e);
    }
    setShowProjectManager(false);
  }, []);

  return (
    <>
      <MainLayout
        callGraph={callGraph}
        selectedContract={selectedContract}
        selectedFunction={selectedFunction}
        onSelectContract={handleSelectContract}
        onSelectFunction={handleSelectFunction}
        onImportClick={handleImportClick}
        onProjectManagerClick={handleProjectManagerClick}
        onReload={handleReload}
        onRenameProject={handleRenameProject}
        onNavigateToLanding={handleNavigateToLanding}
        currentProjectId={currentProjectId}
        currentLibraryId={currentLibraryId}
        savedProjectsCount={savedProjects.length}
        isEditMode={isEditMode}
        onEditModeChange={handleEditModeChange}
        tempEdges={tempEdges}
        onAddTempEdge={handleAddTempEdge}
        onClearTempEdges={handleClearTempEdges}
        onAddUserEdge={handleAddUserEdge}
        onDeleteEdge={handleDeleteEdge}
        showLibraryContracts={showLibraryContracts}
        onShowLibraryContractsChange={setShowLibraryContracts}
        reloadKey={reloadKey}
      />

      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onImport={handleImport}
        />
      )}

      {showProjectManager && (
        <ProjectManager
          projects={savedProjects}
          currentProjectId={currentProjectId}
          currentLibraryId={currentLibraryId}
          onClose={() => setShowProjectManager(false)}
          onSelectProject={handleSwitchProject}
          onDeleteProject={handleDeleteProject}
          onLoadLibrary={handleLoadLibrary}
        />
      )}

      {showOnboarding && (
        <OnboardingTour
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}
    </>
  );
}
