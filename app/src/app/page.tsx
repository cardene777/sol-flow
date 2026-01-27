'use client';

import { useState, useCallback, useEffect } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { UploadModal } from '@/components/Upload/UploadModal';
import { ProjectManager, type LibraryId } from '@/components/Projects/ProjectManager';
import type { CallGraph, ExternalFunction } from '@/types/callGraph';
import {
  getSavedProjects,
  saveProject,
  loadProject,
  deleteProject,
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
        const lastLibraryId = (localStorage.getItem(CURRENT_LIBRARY_KEY) || 'openzeppelin') as LibraryId;
        const response = await fetch(`/api/libraries/${lastLibraryId}`);
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
  }, []);

  // Load a built-in library
  const handleLoadLibrary = useCallback(async (libraryId: LibraryId) => {
    setSelectedContract(null);
    setSelectedFunction(null);
    setCurrentProjectId(null);
    setCurrentLibraryId(libraryId);
    localStorage.removeItem(CURRENT_PROJECT_KEY);
    localStorage.setItem(CURRENT_LIBRARY_KEY, libraryId);

    try {
      const response = await fetch(`/api/libraries/${libraryId}`);
      if (response.ok) {
        const data = await response.json();
        setCallGraph(data.callGraph);
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
        currentProjectId={currentProjectId}
        savedProjectsCount={savedProjects.length}
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
