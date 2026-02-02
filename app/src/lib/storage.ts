/**
 * Local Storage Manager for Sol-Flow
 * Saves and loads parsed CallGraph data
 */

import type { CallGraph } from '@/types/callGraph';

const STORAGE_KEY_PREFIX = 'sol-flow:';
const PROJECTS_INDEX_KEY = `${STORAGE_KEY_PREFIX}projects`;

export interface SavedProject {
  id: string;
  name: string;
  savedAt: string;
  contractCount: number;
  version: string;
}

export interface SourceFile {
  path: string;
  content: string;
}

export interface ProjectData {
  project: SavedProject;
  callGraph: CallGraph;
}

/**
 * Get list of all saved projects
 */
export function getSavedProjects(): SavedProject[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(PROJECTS_INDEX_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    // Error:('Failed to load saved projects:', error);
    return [];
  }
}

/**
 * Save a parsed CallGraph to localStorage
 */
export function saveProject(name: string, callGraph: CallGraph, sourceFiles?: SourceFile[]): SavedProject {
  if (typeof window === 'undefined') {
    throw new Error('Cannot save: not in browser environment');
  }

  const id = `project-${crypto.randomUUID()}`;
  const project: SavedProject = {
    id,
    name,
    savedAt: new Date().toISOString(),
    contractCount: callGraph.contracts.length,
    version: callGraph.version,
  };

  // Save the CallGraph data
  const dataKey = `${STORAGE_KEY_PREFIX}${id}`;
  localStorage.setItem(dataKey, JSON.stringify(callGraph));

  // Save source files if provided (for re-parsing)
  if (sourceFiles && sourceFiles.length > 0) {
    const sourcesKey = `${STORAGE_KEY_PREFIX}${id}:sources`;
    localStorage.setItem(sourcesKey, JSON.stringify(sourceFiles));
  }

  // Update projects index
  const projects = getSavedProjects();
  projects.unshift(project); // Add to beginning (most recent first)
  localStorage.setItem(PROJECTS_INDEX_KEY, JSON.stringify(projects));

  return project;
}

/**
 * Load a project's source files for re-parsing
 */
export function loadProjectSources(projectId: string): SourceFile[] | null {
  if (typeof window === 'undefined') return null;

  try {
    const sourcesKey = `${STORAGE_KEY_PREFIX}${projectId}:sources`;
    const data = localStorage.getItem(sourcesKey);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    // Error:('Failed to load project sources:', error);
    return null;
  }
}

/**
 * Load a saved project's CallGraph
 */
export function loadProject(projectId: string): CallGraph | null {
  if (typeof window === 'undefined') return null;

  try {
    const dataKey = `${STORAGE_KEY_PREFIX}${projectId}`;
    const data = localStorage.getItem(dataKey);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    // Error:('Failed to load project:', error);
    return null;
  }
}

/**
 * Rename a saved project
 */
export function renameProject(projectId: string, newName: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    // Update projects index
    const projects = getSavedProjects();
    const projectIndex = projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) return false;

    projects[projectIndex].name = newName;
    localStorage.setItem(PROJECTS_INDEX_KEY, JSON.stringify(projects));

    // Also update the callGraph's projectName
    const dataKey = `${STORAGE_KEY_PREFIX}${projectId}`;
    const data = localStorage.getItem(dataKey);
    if (data) {
      const callGraph: CallGraph = JSON.parse(data);
      callGraph.projectName = newName;
      localStorage.setItem(dataKey, JSON.stringify(callGraph));
    }

    return true;
  } catch (error) {
    // Error:('Failed to rename project:', error);
    return false;
  }
}

/**
 * Delete a saved project
 */
export function deleteProject(projectId: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    // Remove CallGraph data
    const dataKey = `${STORAGE_KEY_PREFIX}${projectId}`;
    localStorage.removeItem(dataKey);

    // Remove source files
    const sourcesKey = `${STORAGE_KEY_PREFIX}${projectId}:sources`;
    localStorage.removeItem(sourcesKey);

    // Update projects index
    const projects = getSavedProjects();
    const updated = projects.filter(p => p.id !== projectId);
    localStorage.setItem(PROJECTS_INDEX_KEY, JSON.stringify(updated));

    return true;
  } catch (error) {
    // Error:('Failed to delete project:', error);
    return false;
  }
}

/**
 * Check if a project exists
 */
export function projectExists(projectId: string): boolean {
  const projects = getSavedProjects();
  return projects.some(p => p.id === projectId);
}

/**
 * Get total storage used by Sol-Flow (in bytes)
 */
export function getStorageUsage(): { used: number; projects: number } {
  if (typeof window === 'undefined') return { used: 0, projects: 0 };

  let used = 0;
  const projects = getSavedProjects();

  // Count index size
  const indexData = localStorage.getItem(PROJECTS_INDEX_KEY);
  if (indexData) used += indexData.length * 2; // UTF-16

  // Count each project
  for (const project of projects) {
    const dataKey = `${STORAGE_KEY_PREFIX}${project.id}`;
    const data = localStorage.getItem(dataKey);
    if (data) used += data.length * 2;
  }

  return { used, projects: projects.length };
}

/**
 * Clear all Sol-Flow data from localStorage
 */
export function clearAllData(): void {
  if (typeof window === 'undefined') return;

  const projects = getSavedProjects();

  // Remove all project data
  for (const project of projects) {
    const dataKey = `${STORAGE_KEY_PREFIX}${project.id}`;
    localStorage.removeItem(dataKey);
  }

  // Remove index
  localStorage.removeItem(PROJECTS_INDEX_KEY);
}

/**
 * Export project as downloadable JSON
 */
export function exportProject(projectId: string): string | null {
  const callGraph = loadProject(projectId);
  const projects = getSavedProjects();
  const project = projects.find(p => p.id === projectId);

  if (!callGraph || !project) return null;

  const exportData: ProjectData = {
    project,
    callGraph,
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Import project from JSON string
 */
export function importProject(jsonString: string): SavedProject | null {
  if (typeof window === 'undefined') return null;

  try {
    const data: ProjectData = JSON.parse(jsonString);

    if (!data.callGraph || !data.project) {
      throw new Error('Invalid project data format');
    }

    // Generate new ID to avoid conflicts
    const newId = `project-${crypto.randomUUID()}`;
    const project: SavedProject = {
      ...data.project,
      id: newId,
      savedAt: new Date().toISOString(),
    };

    // Save the CallGraph data
    const dataKey = `${STORAGE_KEY_PREFIX}${newId}`;
    localStorage.setItem(dataKey, JSON.stringify(data.callGraph));

    // Update projects index
    const projects = getSavedProjects();
    projects.unshift(project);
    localStorage.setItem(PROJECTS_INDEX_KEY, JSON.stringify(projects));

    return project;
  } catch (error) {
    // Error:('Failed to import project:', error);
    return null;
  }
}

/**
 * Update a project's callGraph (for user edges)
 */
export function updateProjectCallGraph(projectId: string, callGraph: CallGraph): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const dataKey = `${STORAGE_KEY_PREFIX}${projectId}`;
    localStorage.setItem(dataKey, JSON.stringify(callGraph));
    return true;
  } catch (error) {
    // Error:('Failed to update project:', error);
    return false;
  }
}
