'use client';

import { memo, useState } from 'react';
import { X, Trash2, FolderOpen, Database, Shield, Zap, ArrowUpCircle, Eye, Gem, Radio, Layers, ChevronDown, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import type { SavedProject } from '@/lib/storage';
import type { LucideIcon } from 'lucide-react';

// Library item definition
export interface LibraryItem {
  id: string;
  name: string;
  version: string;
  description: string;
  icon: LucideIcon;
  color: LibraryColor;
}

// Library group definition
export interface LibraryGroup {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: LibraryColor;
  children: LibraryItem[];
}

export type LibraryColor = 'mint' | 'blue' | 'amber' | 'purple' | 'cyan' | 'pink' | 'orange' | 'red' | 'emerald' | 'slate';

// Standalone libraries (not in any group)
export const STANDALONE_LIBRARIES: LibraryItem[] = [
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
];

// Library groups with children
export const LIBRARY_GROUPS: LibraryGroup[] = [
  {
    id: 'proxy',
    name: 'Proxy Patterns',
    description: 'Upgradeable proxy implementations',
    icon: Layers,
    color: 'purple',
    children: [
      {
        id: 'sample-uups',
        name: 'UUPS',
        version: 'v1.0.0',
        description: 'Upgrade logic in implementation',
        icon: ArrowUpCircle,
        color: 'purple',
      },
      {
        id: 'sample-transparent',
        name: 'Transparent',
        version: 'v1.0.0',
        description: 'Admin/user call separation',
        icon: Eye,
        color: 'cyan',
      },
      {
        id: 'sample-diamond',
        name: 'Diamond',
        version: 'v1.0.0',
        description: 'Multi-facet upgradeable (EIP-2535)',
        icon: Gem,
        color: 'pink',
      },
      {
        id: 'sample-beacon',
        name: 'Beacon',
        version: 'v1.0.0',
        description: 'Multiple proxies share implementation',
        icon: Radio,
        color: 'orange',
      },
      {
        id: 'sample-erc7546',
        name: 'ERC-7546 Modular',
        version: 'v1.0.0',
        description: 'Function selector to implementation mapping',
        icon: Layers,
        color: 'emerald',
      },
    ],
  },
];

// For backwards compatibility - flat list of all libraries
export const BUILT_IN_LIBRARIES = [
  ...STANDALONE_LIBRARIES,
  ...LIBRARY_GROUPS.flatMap(g => g.children),
] as const;

export type LibraryId = typeof BUILT_IN_LIBRARIES[number]['id'];

// Color classes for different library colors
const COLOR_CLASSES: Record<LibraryColor, { active: string; icon: string; badge: string; groupBg: string }> = {
  mint: {
    active: 'bg-mint/10 border-mint/30 text-mint',
    icon: 'text-mint',
    badge: 'bg-mint/20 text-mint',
    groupBg: 'bg-mint/5',
  },
  blue: {
    active: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    icon: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-400',
    groupBg: 'bg-blue-500/5',
  },
  amber: {
    active: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    icon: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-400',
    groupBg: 'bg-amber-500/5',
  },
  purple: {
    active: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    icon: 'text-purple-400',
    badge: 'bg-purple-500/20 text-purple-400',
    groupBg: 'bg-purple-500/5',
  },
  cyan: {
    active: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    icon: 'text-cyan-400',
    badge: 'bg-cyan-500/20 text-cyan-400',
    groupBg: 'bg-cyan-500/5',
  },
  pink: {
    active: 'bg-pink-500/10 border-pink-500/30 text-pink-400',
    icon: 'text-pink-400',
    badge: 'bg-pink-500/20 text-pink-400',
    groupBg: 'bg-pink-500/5',
  },
  orange: {
    active: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    icon: 'text-orange-400',
    badge: 'bg-orange-500/20 text-orange-400',
    groupBg: 'bg-orange-500/5',
  },
  red: {
    active: 'bg-red-500/10 border-red-500/30 text-red-400',
    icon: 'text-red-400',
    badge: 'bg-red-500/20 text-red-400',
    groupBg: 'bg-red-500/5',
  },
  emerald: {
    active: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    icon: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-400',
    groupBg: 'bg-emerald-500/5',
  },
  slate: {
    active: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
    icon: 'text-slate-400',
    badge: 'bg-slate-500/20 text-slate-400',
    groupBg: 'bg-slate-500/5',
  },
};

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
  // Track expanded groups (default: expand group containing active library)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    // Auto-expand group containing current library
    if (currentLibraryId) {
      for (const group of LIBRARY_GROUPS) {
        if (group.children.some(lib => lib.id === currentLibraryId)) {
          initial.add(group.id);
          break;
        }
      }
    }
    return initial;
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

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

  // Render a single library item
  const renderLibraryItem = (lib: LibraryItem, indented = false) => {
    const Icon = lib.icon;
    const isActive = currentProjectId === null && currentLibraryId === lib.id;
    const colorClasses = COLOR_CLASSES[lib.color];

    return (
      <button
        key={lib.id}
        onClick={() => onLoadLibrary(lib.id as LibraryId)}
        className={clsx(
          'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-all',
          indented && 'ml-6',
          isActive
            ? colorClasses.active
            : 'bg-navy-700/50 border-navy-600 text-slate-300 hover:bg-navy-700 hover:border-navy-500'
        )}
      >
        <Icon className={clsx('w-4 h-4', isActive ? colorClasses.icon : 'text-slate-400')} />
        <div className="flex-1 text-left">
          <div className="font-medium text-sm">{lib.name}</div>
          <div className="text-xs text-slate-500">{lib.description}</div>
        </div>
        <span className={clsx('text-[10px] px-1.5 py-0.5 rounded', colorClasses.badge)}>
          {lib.version}
        </span>
        {isActive && (
          <span className={clsx('text-xs px-2 py-0.5 rounded', colorClasses.badge)}>
            Active
          </span>
        )}
      </button>
    );
  };

  // Render a library group
  const renderLibraryGroup = (group: LibraryGroup) => {
    const Icon = group.icon;
    const isExpanded = expandedGroups.has(group.id);
    const hasActiveChild = group.children.some(lib => currentProjectId === null && currentLibraryId === lib.id);
    const colorClasses = COLOR_CLASSES[group.color];

    return (
      <div key={group.id} className="space-y-1">
        {/* Group header */}
        <button
          onClick={() => toggleGroup(group.id)}
          className={clsx(
            'w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all',
            hasActiveChild
              ? colorClasses.active
              : 'bg-navy-700/30 border-navy-600 text-slate-300 hover:bg-navy-700/50 hover:border-navy-500'
          )}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
          <Icon className={clsx('w-5 h-5', hasActiveChild ? colorClasses.icon : 'text-slate-400')} />
          <div className="flex-1 text-left">
            <div className="font-medium">{group.name}</div>
            <div className="text-xs text-slate-500">{group.description}</div>
          </div>
          <span className="text-xs text-slate-500 bg-navy-600 px-2 py-0.5 rounded">
            {group.children.length}
          </span>
        </button>

        {/* Expanded children */}
        {isExpanded && (
          <div className={clsx('space-y-1 py-2 px-2 rounded-lg', colorClasses.groupBg)}>
            {group.children.map(lib => renderLibraryItem(lib, true))}
          </div>
        )}
      </div>
    );
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
              {/* Standalone libraries */}
              {STANDALONE_LIBRARIES.map(lib => renderLibraryItem(lib))}

              {/* Library groups */}
              {LIBRARY_GROUPS.map(group => renderLibraryGroup(group))}
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
