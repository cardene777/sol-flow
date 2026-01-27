'use client';

import { useState, useCallback, useRef } from 'react';
import { X, Upload, FolderOpen, FileCode2, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import type { CallGraph } from '@/types/callGraph';

interface FileData {
  path: string;
  content: string;
}

interface UploadModalProps {
  onClose: () => void;
  onImport: (callGraph: CallGraph) => void;
}

export function UploadModal({ onClose, onImport }: UploadModalProps) {
  const [files, setFiles] = useState<FileData[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('My Project');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File, relativePath: string): Promise<FileData | null> => {
    const fileName = file.name.toLowerCase();
    const lowerPath = relativePath.toLowerCase();

    // Only accept .sol files
    if (!fileName.endsWith('.sol')) {
      return null;
    }

    // Skip test files (.t.sol) and script files (.s.sol)
    if (fileName.endsWith('.t.sol') || fileName.endsWith('.s.sol')) {
      return null;
    }

    // Skip external dependencies and test directories only
    // Keep user's own libs, storages, interfaces
    if (
      lowerPath.includes('/node_modules/') ||
      lowerPath.includes('/mocks/') ||
      lowerPath.includes('/forge-std/') ||
      lowerPath.includes('/test/') ||
      lowerPath.includes('/tests/')
    ) {
      return null;
    }

    const content = await file.text();

    return {
      path: relativePath,
      content,
    };
  }, []);

  const processFileEntry = useCallback(async (
    entry: FileSystemEntry,
    basePath: string = ''
  ): Promise<FileData[]> => {
    const results: FileData[] = [];

    if (entry.isFile) {
      const fileEntry = entry as FileSystemFileEntry;
      const file = await new Promise<File>((resolve, reject) => {
        fileEntry.file(resolve, reject);
      });
      const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;
      const fileData = await processFile(file, relativePath);
      if (fileData) {
        results.push(fileData);
      }
    } else if (entry.isDirectory) {
      const dirEntry = entry as FileSystemDirectoryEntry;
      const reader = dirEntry.createReader();
      const entries = await new Promise<FileSystemEntry[]>((resolve, reject) => {
        const allEntries: FileSystemEntry[] = [];
        const readBatch = () => {
          reader.readEntries((batch) => {
            if (batch.length === 0) {
              resolve(allEntries);
            } else {
              allEntries.push(...batch);
              readBatch();
            }
          }, reject);
        };
        readBatch();
      });

      const newPath = basePath ? `${basePath}/${entry.name}` : entry.name;
      for (const childEntry of entries) {
        const childResults = await processFileEntry(childEntry, newPath);
        results.push(...childResults);
      }
    }

    return results;
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError(null);

    const items = e.dataTransfer.items;
    const newFiles: FileData[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const entry = item.webkitGetAsEntry?.();
      if (entry) {
        const results = await processFileEntry(entry);
        newFiles.push(...results);
      }
    }

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
    }
  }, [processFileEntry]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    setError(null);
    const newFiles: FileData[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
      const fileData = await processFile(file, relativePath);
      if (fileData) {
        newFiles.push(fileData);
      }
    }

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
    }

    e.target.value = '';
  }, [processFile]);

  const handleImport = useCallback(async () => {
    if (files.length === 0) {
      setError('Please add some files');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName,
          files,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to parse files');
      }

      const data = await response.json();
      onImport(data.callGraph);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse files');
    } finally {
      setIsProcessing(false);
    }
  }, [files, projectName, onImport, onClose]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearAllFiles = useCallback(() => {
    setFiles([]);
    setError(null);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-navy-800 border border-navy-600 rounded-xl shadow-2xl w-[600px] max-w-[95vw] max-h-[90vh] flex flex-col animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-600">
          <div>
            <h2 className="font-display font-semibold text-lg text-slate-100">
              Import Contracts
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Upload Solidity files (.sol) - Test/Script files are excluded
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-navy-600 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {/* Project Name */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 bg-navy-700 border border-navy-500 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-mint/50"
              placeholder="Enter project name"
            />
          </div>

          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={clsx(
              'border-2 border-dashed rounded-xl p-8 text-center transition-all',
              isDragging
                ? 'border-mint bg-mint/10'
                : 'border-navy-500 hover:border-navy-400'
            )}
          >
            <Upload className={clsx(
              'w-12 h-12 mx-auto mb-4',
              isDragging ? 'text-mint' : 'text-slate-500'
            )} />
            <p className="text-slate-300 mb-2">
              Drag & drop files or folders here
            </p>
            <p className="text-slate-500 text-sm mb-4">
              or click the buttons below
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-navy-600 hover:bg-navy-500 rounded-lg text-slate-200 text-sm transition-colors"
              >
                <FileCode2 className="w-4 h-4" />
                Select Files
              </button>
              <button
                onClick={() => folderInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-navy-600 hover:bg-navy-500 rounded-lg text-slate-200 text-sm transition-colors"
              >
                <FolderOpen className="w-4 h-4" />
                Select Folder
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".sol"
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              ref={folderInputRef}
              type="file"
              // @ts-expect-error - webkitdirectory is not standard but widely supported
              webkitdirectory=""
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium text-slate-400 flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-mint" />
                  Solidity Files ({files.length})
                </h4>
                <button
                  onClick={clearAllFiles}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Clear all
                </button>
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={`sol-${index}`}
                    className="flex items-center justify-between px-3 py-2 bg-navy-700 rounded-lg"
                  >
                    <span className="text-xs text-slate-300 font-mono truncate">
                      {file.path}
                    </span>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-navy-500 rounded text-slate-500 hover:text-slate-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-navy-600">
          <span className="text-xs text-slate-500">
            {files.length} files selected
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-slate-200 text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={files.length === 0 || isProcessing}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                files.length > 0 && !isProcessing
                  ? 'bg-mint text-navy-900 hover:bg-mint/90'
                  : 'bg-navy-600 text-slate-500 cursor-not-allowed'
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
