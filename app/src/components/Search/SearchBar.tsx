'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import clsx from 'clsx';
import type { CallGraph, Contract, ExternalFunction } from '@/types/callGraph';

interface SearchResult {
  type: 'contract' | 'function' | 'event' | 'error';
  contract: Contract;
  item?: ExternalFunction;
  name: string;
  path: string;
}

interface SearchBarProps {
  callGraph: CallGraph;
  onSelectContract: (name: string) => void;
}

export function SearchBar({ callGraph, onSelectContract }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'contract' | 'function' | 'event'>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const results = useMemo<SearchResult[]>(() => {
    if (query.length < 2) return [];

    const q = query.toLowerCase();
    const results: SearchResult[] = [];

    for (const contract of callGraph.contracts) {
      // Contract name search
      if (filter === 'all' || filter === 'contract') {
        if (contract.name.toLowerCase().includes(q)) {
          results.push({
            type: 'contract',
            contract,
            name: contract.name,
            path: contract.filePath,
          });
        }
      }

      // Function search
      if (filter === 'all' || filter === 'function') {
        for (const fn of contract.externalFunctions) {
          if (fn.name.toLowerCase().includes(q)) {
            results.push({
              type: 'function',
              contract,
              item: fn,
              name: `${contract.name}.${fn.name}()`,
              path: contract.filePath,
            });
          }
        }
      }

      // Event search
      if (filter === 'all' || filter === 'event') {
        for (const event of contract.events) {
          if (event.name.toLowerCase().includes(q)) {
            results.push({
              type: 'event',
              contract,
              name: `${contract.name}.${event.name}`,
              path: contract.filePath,
            });
          }
        }
      }
    }

    return results.slice(0, 20);
  }, [callGraph, query, filter]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      onSelectContract(result.contract.name);
      setQuery('');
      setIsOpen(false);
    },
    [onSelectContract]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    },
    []
  );

  return (
    <div ref={containerRef} className="relative">
      <div
        className={clsx(
          'search-bar flex items-center gap-2 px-3 py-2 rounded-lg',
          'bg-navy-700 border border-transparent',
          'transition-all duration-200'
        )}
      >
        <Search className="w-4 h-4 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search contracts, functions..."
          className="bg-transparent border-none outline-none text-slate-200 placeholder-slate-500 w-64 text-sm font-display"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="p-0.5 hover:bg-navy-500 rounded transition-colors"
          >
            <X className="w-4 h-4 text-slate-400 hover:text-slate-200" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-navy-700 rounded-lg shadow-xl border border-navy-500 max-h-96 overflow-auto z-50">
          {/* Filters */}
          <div className="flex gap-2 p-2 border-b border-navy-500">
            {(['all', 'contract', 'function', 'event'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  'px-2 py-1 rounded text-xs font-medium transition-colors',
                  filter === f
                    ? 'bg-mint/20 text-mint'
                    : 'bg-navy-600 text-slate-400 hover:bg-navy-500 hover:text-slate-300'
                )}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Results */}
          <div className="py-1">
            {results.map((result, i) => (
              <button
                key={`${result.name}-${i}`}
                onClick={() => handleSelect(result)}
                className="w-full px-4 py-2 text-left hover:bg-navy-600 flex items-center gap-3 transition-colors"
              >
                <span
                  className={clsx(
                    'text-[10px] px-2 py-0.5 rounded font-medium',
                    result.type === 'contract' && 'bg-blue-500/20 text-blue-400',
                    result.type === 'function' && 'bg-mint/20 text-mint',
                    result.type === 'event' && 'bg-coral/20 text-coral'
                  )}
                >
                  {result.type}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-slate-200 font-mono text-sm truncate">
                    {result.name}
                  </div>
                  <div className="text-slate-500 text-xs truncate font-display">
                    {result.path}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {isOpen && query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-navy-700 rounded-lg shadow-xl border border-navy-500 p-4 text-center text-slate-500 text-sm">
          No results found
        </div>
      )}
    </div>
  );
}
