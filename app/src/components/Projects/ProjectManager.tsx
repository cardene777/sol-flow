'use client';

import { memo } from 'react';
import { X, Trash2, FolderOpen, Database, Shield, Zap } from 'lucide-react';
import clsx from 'clsx';
import type { SavedProject } from '@/lib/storage';

// Built-in libraries
export const BUILT_IN_LIBRARIES = [
  {
    id: 'openzeppelin',
    name: 'OpenZeppelin Contracts',
    version: 'v5.0.0',
    description: 'Industry standard smart contract library',
    icon: Shield,
    color: 'mint',
  },
  {
    id: 'openzeppelin-upgradeable',
    name: 'OpenZeppelin Upgradeable',
    version: 'v5.0.0',
    description: 'Upgradeable contracts with proxy patterns',
    icon: Database,
    color: 'blue',
  },
  {
    id: 'solady',
    name: 'Solady',
    version: 'latest',
    description: 'Gas-optimized Solidity snippets',
    icon: Zap,
    color: 'amber',
  },
] as const;

export type LibraryId = typeof BUILT_IN_LIBRARIES[number]['id'];

interface ProjectManagerProps {
  projects: SavedProject[];
  currentProjectId: string | null;
  currentLibraryId: LibraryId | null;
  onClose: () => void;
  onSelectProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onLoadLibrary: (libraryId: LibraryId) => void;
}

function ProjectManagerComponent({
  projects,
  currentProjectId,
  currentLibraryId,
  onClose,
  onSelectProject,
  onDeleteProject,
  onLoadLibrary,
}: ProjectManagerProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatSize = (contractCount: number) => {
    return `${contractCount} contracts`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-navy-800 border border-navy-600 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-600">
          <div className="flex items-center gap-3">
            <FolderOpen className="w-5 h-5 text-mint" />
            <h2 className="text-lg font-semibold text-white">Projects</h2>
            <span className="text-xs text-slate-500 bg-navy-700 px-2 py-0.5 rounded">
              {projects.length} saved
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-navy-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {/* Built-in Libraries */}
          <div className="mb-4">
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 px-2">
              Built-in Libraries
            </h3>
            <div className="space-y-2">
              {BUILT_IN_LIBRARIES.map((lib) => {
                const Icon = lib.icon;
                const isActive = currentProjectId === null && currentLibraryId === lib.id;
                const colorClasses = {
                  mint: {
                    active: 'bg-mint/10 border-mint/30 text-mint',
                    icon: 'text-mint',
                    badge: 'bg-mint/20 text-mint',
                  },
                  blue: {
                    active: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
                    icon: 'text-blue-400',
                    badge: 'bg-blue-500/20 text-blue-400',
                  },
                  amber: {
                    active: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
                    icon: 'text-amber-400',
                    badge: 'bg-amber-500/20 text-amber-400',
                  },
                }[lib.color];

                return (
                  <button
                    key={lib.id}
                    onClick={() => onLoadLibrary(lib.id)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all',
                      isActive
                        ? colorClasses.active
                        : 'bg-navy-700/50 border-navy-600 text-slate-300 hover:bg-navy-700 hover:border-navy-500'
                    )}
                  >
                    <Icon className={clsx('w-5 h-5', isActive ? colorClasses.icon : 'text-slate-400')} />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{lib.name}</div>
                      <div className="text-xs text-slate-500">{lib.description} - {lib.version}</div>
                    </div>
                    {isActive && (
                      <span className={clsx('text-xs px-2 py-0.5 rounded', colorClasses.badge)}>
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Saved Projects */}
          <div>
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 px-2">
              Saved Projects
            </h3>
            {projects.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No saved projects yet</p>
                <p className="text-xs mt-1">Import contracts to save them here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-3 rounded-lg border transition-all',
                      currentProjectId === project.id
                        ? 'bg-mint/10 border-mint/30'
                        : 'bg-navy-700/50 border-navy-600 hover:bg-navy-700 hover:border-navy-500'
                    )}
                  >
                    <button
                      onClick={() => onSelectProject(project.id)}
                      className="flex-1 flex items-center gap-3 text-left"
                    >
                      <FolderOpen className={clsx(
                        'w-5 h-5',
                        currentProjectId === project.id ? 'text-mint' : 'text-slate-400'
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className={clsx(
                          'font-medium truncate',
                          currentProjectId === project.id ? 'text-mint' : 'text-slate-300'
                        )}>
                          {project.name}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <span>{formatSize(project.contractCount)}</span>
                          <span>•</span>
                          <span>{formatDate(project.savedAt)}</span>
                        </div>
                      </div>
                      {currentProjectId === project.id && (
                        <span className="text-xs bg-mint/20 text-mint px-2 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${project.name}"?`)) {
                          onDeleteProject(project.id);
                        }
                      }}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-navy-600 bg-navy-900/50">
          <p className="text-xs text-slate-500 text-center">
            Projects are saved in your browser&apos;s local storage
          </p>
        </div>
      </div>
    </div>
  );
}

export const ProjectManager = memo(ProjectManagerComponent);
