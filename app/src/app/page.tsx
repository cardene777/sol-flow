'use client';

import { useState, useCallback, useEffect } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { UploadModal } from '@/components/Upload/UploadModal';
import { ProjectManager, type LibraryId } from '@/components/Projects/ProjectManager';
import type { CallGraph, ExternalFunction, UserEdge } from '@/types/callGraph';
import type { TempEdge } from '@/components/Canvas/DiagramCanvas';
import {
  getSavedProjects,
  saveProject,
  loadProject,
  deleteProject,
  renameProject,
  updateProjectCallGraph,
  type SavedProject,
} from '@/lib/storage';

const CURRENT_PROJECT_KEY = 'sol-flow-current-project';
const CURRENT_LIBRARY_KEY = 'sol-flow-current-library';

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

export default function Home() {
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

  // Load saved projects list and current project
  useEffect(() => {
    async function loadInitialData() {
      try {
        // Load saved projects list
        const projects = getSavedProjects();
        setSavedProjects(projects);

        // Check for last opened project
        const lastProjectId = localStorage.getItem(CURRENT_PROJECT_KEY);
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
        let lastLibraryId = (localStorage.getItem(CURRENT_LIBRARY_KEY) || 'openzeppelin') as LibraryId;
        let response = await fetch(`/api/libraries/${lastLibraryId}`);

        // Fallback to openzeppelin if the saved library doesn't exist
        if (!response.ok && lastLibraryId !== 'openzeppelin') {
          console.warn(`Library ${lastLibraryId} not found, falling back to openzeppelin`);
          lastLibraryId = 'openzeppelin';
          localStorage.setItem(CURRENT_LIBRARY_KEY, 'openzeppelin');
          response = await fetch(`/api/libraries/openzeppelin`);
        }

        if (response.ok) {
          const data = await response.json();
          setCallGraph(data.callGraph);
          setCurrentProjectId(null);
          setCurrentLibraryId(lastLibraryId);
        }
      } catch (e) {
        console.error('Failed to load initial data:', e);
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, []);

  // Handle importing new project
  const handleImport = useCallback((newCallGraph: CallGraph) => {
    setCallGraph(newCallGraph);
    setSelectedContract(null);
    setSelectedFunction(null);

    // Save to localStorage as new project
    try {
      const project = saveProject(newCallGraph.projectName, newCallGraph);
      setCurrentProjectId(project.id);
      setCurrentLibraryId(null);
      setSavedProjects(getSavedProjects());
      localStorage.setItem(CURRENT_PROJECT_KEY, project.id);
      localStorage.removeItem(CURRENT_LIBRARY_KEY);
    } catch (e) {
      console.error('Failed to save project:', e);
    }
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
      localStorage.setItem(CURRENT_PROJECT_KEY, projectId);
      localStorage.removeItem(CURRENT_LIBRARY_KEY);
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
      localStorage.removeItem(CURRENT_PROJECT_KEY);
      localStorage.setItem(CURRENT_LIBRARY_KEY, 'openzeppelin');
      fetch('/api/libraries/openzeppelin')
        .then(res => res.json())
        .then(data => setCallGraph(data.callGraph))
        .catch(console.error);
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

  // Reload current view (forces re-render with updated transformToReactFlow)
  const handleReload = useCallback(() => {
    // Force re-render by creating a new callGraph object reference
    setCallGraph(prev => ({ ...prev }));
    setSelectedContract(null);
    setSelectedFunction(null);
    // Clear temp edges on reload
    setTempEdges([]);
  }, []);

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
    localStorage.removeItem(CURRENT_PROJECT_KEY);
    localStorage.setItem(CURRENT_LIBRARY_KEY, libraryId);

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
        console.error('Failed to load library: Response not OK', response.status);
      }
    } catch (e) {
      console.error('Failed to load library:', e);
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
    </>
  );
}
