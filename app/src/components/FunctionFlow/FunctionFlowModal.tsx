'use client';

import { useMemo, useCallback, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  type Node,
  type Edge,
  MarkerType,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import { X, Maximize2, Minimize2, RotateCcw, ZoomIn } from 'lucide-react';
import type { ExternalFunction, InternalFunction, Contract, CallGraph, FunctionCall, ImportInfo } from '@/types/callGraph';
import { CodeBlockNode } from './CodeBlockNode';
import { normalizeVersionedPath, findRemapping, getGitHubUrlForPath } from '@/config/remappings';

interface FunctionFlowModalProps {
  func: ExternalFunction;
  contract: Contract;
  callGraph: CallGraph;
  libraryId?: string | null;
  onClose: () => void;
}

const nodeTypes = {
  codeBlock: CodeBlockNode,
};

function FunctionFlowContent({ func, contract, callGraph, libraryId, onClose }: FunctionFlowModalProps) {
  const { fitView } = useReactFlow();
  const [isFullscreen, setIsFullscreen] = useState(true);

  const { nodes, edges } = useMemo(() => {
    return buildFlowGraph(func, contract, callGraph, libraryId);
  }, [func, contract, callGraph, libraryId]);

  const handleResetView = useCallback(() => {
    fitView({ padding: 0.2, duration: 300 });
  }, [fitView]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div
        className={`bg-navy-900 border border-navy-600 rounded-xl shadow-2xl flex flex-col animate-fade-in-up ${
          isFullscreen
            ? 'w-[98vw] h-[96vh]'
            : 'w-[1200px] max-w-[95vw] h-[900px] max-h-[90vh]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-600 bg-navy-800/50">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-mint/20 text-mint rounded font-medium">
                Function Diagram
              </span>
              <h2 className="font-mono font-semibold text-lg text-slate-100">
                {func.name}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              {contract.name} - {contract.filePath}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetView}
              className="p-2 hover:bg-navy-600 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-navy-600 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
              title={isFullscreen ? 'Minimize' : 'Maximize'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-navy-600 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Flow Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            minZoom={0.1}
            maxZoom={2}
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={false}
            selectNodesOnDrag={false}
            panOnDrag
            zoomOnScroll
            defaultEdgeOptions={{
              type: 'default',
              animated: true,
            }}
          >
            <Background color="rgba(64, 156, 255, 0.03)" gap={30} size={1} />
            <Controls
              className="!bg-navy-700 !border-navy-500 [&>button]:!bg-navy-600 [&>button]:!border-navy-500 [&>button]:!text-slate-300"
              showInteractive={false}
            />
            <Panel position="bottom-center" className="flex items-center gap-4 text-xs bg-navy-800/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-navy-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-mint" />
                <span className="text-slate-400">Entry Point</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-lavender" />
                <span className="text-slate-400">Internal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber" />
                <span className="text-slate-400">Library</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-400" />
                <span className="text-slate-400">External</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-400" />
                <span className="text-slate-400">Delegatecall</span>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}

export function FunctionFlowModal(props: FunctionFlowModalProps) {
  return (
    <ReactFlowProvider>
      <FunctionFlowContent {...props} />
    </ReactFlowProvider>
  );
}

interface CodeBlockNodeData {
  label: string;
  functionName: string;
  sourceCode: string;
  startLine: number;
  type: 'entry' | 'internal' | 'library' | 'external' | 'delegatecall';
  filePath?: string;
  libraryId?: string | null;
}

// Find contract by name, preferring contracts in similar paths
function findContractByName(contracts: Contract[], name: string, referenceFilePath?: string): Contract | undefined {
  const matches = contracts.filter(c => c.name === name);
  if (matches.length === 0) return undefined;
  if (matches.length === 1) return matches[0];

  // Multiple matches - prefer the one with the closest path
  if (referenceFilePath) {
    const refParts = referenceFilePath.split('/');
    let bestMatch = matches[0];
    let bestScore = 0;

    for (const match of matches) {
      const matchParts = match.filePath.split('/');
      let score = 0;
      // Count matching path segments from the start
      for (let i = 0; i < Math.min(refParts.length, matchParts.length); i++) {
        if (refParts[i] === matchParts[i]) {
          score++;
        } else {
          break;
        }
      }
      // Also prefer shorter paths (likely the main version)
      if (score > bestScore || (score === bestScore && match.filePath.length < bestMatch.filePath.length)) {
        bestScore = score;
        bestMatch = match;
      }
    }
    return bestMatch;
  }

  // No reference path - prefer shortest path (likely main version)
  return matches.reduce((a, b) => a.filePath.length <= b.filePath.length ? a : b);
}

// Find function by name and optionally by argument count (for overloaded functions)
function findFunctionByNameAndArgs<T extends { name: string; parameters: { name: string; type: string }[] }>(
  functions: T[],
  name: string,
  argCount?: number
): T | undefined {
  const matches = functions.filter(f => f.name === name);
  if (matches.length === 0) return undefined;
  if (matches.length === 1) return matches[0];

  // Multiple matches (overloaded functions) - try to match by argument count
  if (argCount !== undefined) {
    const exactMatch = matches.find(f => f.parameters.length === argCount);
    if (exactMatch) return exactMatch;
  }

  // Return first match as fallback
  return matches[0];
}

// Resolve a relative import path to an absolute path
function resolveRelativePath(basePath: string, relativePath: string): string {
  // Get the directory of the base file
  const baseDir = basePath.split('/').slice(0, -1);

  // Split the relative path
  const parts = relativePath.split('/');

  // Process each part
  for (const part of parts) {
    if (part === '..') {
      baseDir.pop();
    } else if (part !== '.' && part !== '') {
      baseDir.push(part);
    }
  }

  return baseDir.join('/');
}

function buildFlowGraph(
  func: ExternalFunction,
  contract: Contract,
  callGraph: CallGraph,
  libraryId?: string | null
): { nodes: Node<CodeBlockNodeData>[]; edges: Edge[] } {
  const nodes: Node<CodeBlockNodeData>[] = [];
  const edges: Edge[] = [];

  let nodeIndex = 0;
  const visitedFunctions = new Set<string>();
  const nodePositions = new Map<string, { x: number; y: number }>();

  // Layout configuration - spread horizontally like the reference image
  const nodeWidth = 500;
  const horizontalGap = 250;
  const verticalGap = 80;

  // Track columns for horizontal layout
  let currentColumn = 0;
  const columnOccupancy = new Map<number, number>(); // column -> max Y used

  const createNodeId = () => `node-${nodeIndex++}`;

  const getColumnY = (column: number): number => {
    return columnOccupancy.get(column) || 0;
  };

  const updateColumnY = (column: number, bottomY: number) => {
    const current = columnOccupancy.get(column) || 0;
    // Track the maximum bottom position for this column
    columnOccupancy.set(column, Math.max(current, bottomY + verticalGap));
  };

  const estimateNodeHeight = (code: string): number => {
    const lines = code.split('\n').length;
    // More accurate estimate: ~24px per line + 100px for header/footer/padding
    return Math.max(180, lines * 24 + 100);
  };

  // Create the entry node (main function)
  const entryNodeId = createNodeId();
  const entrySourceCode = func.sourceCode || `function ${func.name}() ${func.stateMutability} { ... }`;
  const entryHeight = estimateNodeHeight(entrySourceCode);
  const entryX = 0;
  const entryY = 0;

  nodes.push({
    id: entryNodeId,
    type: 'codeBlock',
    position: { x: entryX, y: entryY },
    data: {
      label: `function ${func.name}`,
      functionName: func.name,
      sourceCode: entrySourceCode,
      startLine: func.startLine || 1,
      type: 'entry',
      filePath: contract.filePath,
      libraryId,
    },
  });

  // Include parameter count in keys to distinguish overloaded functions
  const entryFuncKey = `${contract.name}.${func.name}:${func.parameters.length}`;
  nodePositions.set(entryFuncKey, { x: entryX, y: entryY });
  updateColumnY(0, entryY + entryHeight);
  visitedFunctions.add(entryFuncKey);

  // Process calls recursively
  processCallsHorizontally(
    func.calls,
    entryNodeId,
    contract,
    callGraph,
    1, // start from column 1
    entryY + entryHeight / 2, // center Y of entry node
    0 // depth
  );

  function processCallsHorizontally(
    calls: FunctionCall[],
    parentNodeId: string,
    currentContract: Contract,
    graph: CallGraph,
    column: number,
    parentCenterY: number,
    depth: number
  ) {
    if (depth > 4) return; // Limit recursion depth

    const x = column * (nodeWidth + horizontalGap);
    let y = getColumnY(column);

    // Center the calls around the parent's center Y if possible
    if (calls.length > 0 && y < parentCenterY - 200) {
      y = parentCenterY - 200;
    }

    for (const call of calls) {
      // Include argCount in key to distinguish overloaded functions
      const argCountSuffix = call.argCount !== undefined ? `:${call.argCount}` : '';
      const funcKey = `${call.type === 'library' ? call.target : currentContract.name + '.' + call.target}${argCountSuffix}`;

      // Skip if already visited (prevent cycles)
      if (visitedFunctions.has(funcKey)) {
        continue;
      }
      visitedFunctions.add(funcKey);

      let targetFunc: InternalFunction | ExternalFunction | undefined;
      let targetContract = currentContract;
      let nodeType: 'internal' | 'library' | 'external' | 'delegatecall' = 'internal';

      let externalLibraryPath: string | null = null;

      if (call.type === 'library') {
        // Library call
        const [libNameOrAlias, funcName] = call.target.includes('.')
          ? call.target.split('.')
          : ['', call.target];

        // First, check if this is an imported alias in the current contract
        const importInfo = currentContract.imports?.find(
          (imp: ImportInfo) => (imp.alias || imp.name) === libNameOrAlias
        );

        const actualName = importInfo?.name || libNameOrAlias;

        let library: Contract | undefined;

        // PRIORITY 1: If we have import info, resolve by path first (most accurate)
        if (importInfo) {
          if (importInfo.isExternal) {
            // Normalize the import path (remove version numbers)
            const normalizedPath = normalizeVersionedPath(importInfo.path);

            // Search for matching contract in the graph
            library = graph.contracts.find(c => {
              const normalizedContractPath = normalizeVersionedPath(c.filePath);
              // Direct match
              if (normalizedContractPath === normalizedPath) return true;
              // Match by filename (e.g., TeleporterMessenger.sol)
              const fileName = normalizedPath.split('/').pop();
              const contractFileName = normalizedContractPath.split('/').pop();
              if (fileName === contractFileName && c.name === actualName) return true;
              return false;
            });
          } else {
            // For relative imports, resolve the path and search
            const resolvedPath = resolveRelativePath(currentContract.filePath, importInfo.path);
            library = graph.contracts.find(c =>
              c.filePath === resolvedPath ||
              c.filePath.endsWith(resolvedPath) ||
              resolvedPath.endsWith(c.filePath)
            );
          }
        }

        // PRIORITY 2: Fallback to name-based search only if path search failed
        if (!library) {
          // Try exact name matches first, preferring contracts in similar paths
          library = findContractByName(graph.contracts, actualName, currentContract.filePath)
            || findContractByName(graph.contracts, libNameOrAlias, currentContract.filePath)
            || findContractByName(graph.contracts, `${libNameOrAlias}Lib`, currentContract.filePath);

          // Fall back to case-insensitive search
          if (!library) {
            const lowerActual = actualName.toLowerCase();
            const lowerAlias = libNameOrAlias.toLowerCase();
            const matches = graph.contracts.filter(c =>
              c.name.toLowerCase() === lowerActual ||
              c.name.toLowerCase() === lowerAlias
            );
            if (matches.length > 0) {
              library = findContractByName(matches, matches[0].name, currentContract.filePath);
            }
          }
        }

        if (library) {
          targetContract = library;
          // Look in both internal and external functions, matching by argCount for overloaded functions
          targetFunc = findFunctionByNameAndArgs(library.internalFunctions, funcName, call.argCount)
            || findFunctionByNameAndArgs(library.externalFunctions, funcName, call.argCount);
        } else if (importInfo) {
          // Has import but not found in graph - library wasn't resolved
          externalLibraryPath = normalizeVersionedPath(importInfo.path);
        } else {
          // No import found, assume external
          externalLibraryPath = `@unknown/${libNameOrAlias}.sol`;
        }
        nodeType = 'library';
      } else if (call.type === 'internal') {
        // Internal call - search both internal and external functions
        // (public functions can be called internally but are stored in externalFunctions)
        // Use argCount for matching overloaded functions
        targetFunc = findFunctionByNameAndArgs(currentContract.internalFunctions, call.target, call.argCount)
          || findFunctionByNameAndArgs(currentContract.externalFunctions, call.target, call.argCount);

        // If not found in current contract, search in inherited contracts (recursively)
        if (!targetFunc && currentContract.inherits) {
          const searchInherited = (contractToSearch: Contract, visited: Set<string>): { func: InternalFunction | ExternalFunction; contract: Contract } | null => {
            if (visited.has(contractToSearch.name)) return null;
            visited.add(contractToSearch.name);

            for (const parentName of contractToSearch.inherits || []) {
              // Use findContractByName to prefer contracts from similar paths
              const parentContract = findContractByName(graph.contracts, parentName, contractToSearch.filePath);
              if (parentContract) {
                // Use argCount for matching overloaded functions
                const parentFunc = findFunctionByNameAndArgs(parentContract.internalFunctions, call.target, call.argCount)
                  || findFunctionByNameAndArgs(parentContract.externalFunctions, call.target, call.argCount);
                if (parentFunc) {
                  return { func: parentFunc, contract: parentContract };
                }
                // Recursively search grandparents
                const result = searchInherited(parentContract, visited);
                if (result) return result;
              }
            }
            return null;
          };

          const result = searchInherited(currentContract, new Set());
          if (result) {
            targetFunc = result.func;
            targetContract = result.contract;
          }
        }
        nodeType = 'internal';
      } else if (call.type === 'external') {
        nodeType = 'external';

        // Try to resolve external call using targetType (e.g., ITeleporterMessenger)
        if (call.targetType) {
          const funcName = call.target.includes('.') ? call.target.split('.')[1] : call.target;

          let externalContract: Contract | undefined;

          // PRIORITY 1: If type starts with 'I' (interface), try to find implementation first
          // e.g., ITeleporterMessenger -> TeleporterMessenger
          if (call.targetType.startsWith('I') && call.targetType[1] === call.targetType[1]?.toUpperCase()) {
            const implName = call.targetType.slice(1); // Remove 'I' prefix
            externalContract = findContractByName(graph.contracts, implName, currentContract.filePath);
          }

          // PRIORITY 2: Fall back to exact type name match
          if (!externalContract) {
            externalContract = findContractByName(graph.contracts, call.targetType, currentContract.filePath);
          }

          // PRIORITY 3: If found but no source code for function, try implementation again
          if (externalContract) {
            targetContract = externalContract;
            // Use argCount for matching overloaded functions
            targetFunc = findFunctionByNameAndArgs(externalContract.externalFunctions, funcName, call.argCount)
              || findFunctionByNameAndArgs(externalContract.internalFunctions, funcName, call.argCount);

            // If function found but no source code (interface), try to find implementation
            if (targetFunc && !targetFunc.sourceCode && externalContract.kind === 'interface') {
              const implName = call.targetType?.startsWith('I') ? call.targetType.slice(1) : call.targetType;
              const implContract = findContractByName(
                graph.contracts.filter(c => c.kind !== 'interface'),
                implName,
                currentContract.filePath
              );
              if (implContract) {
                // Use argCount for matching overloaded functions
                const implFunc = findFunctionByNameAndArgs(implContract.externalFunctions, funcName, call.argCount)
                  || findFunctionByNameAndArgs(implContract.internalFunctions, funcName, call.argCount);
                if (implFunc?.sourceCode) {
                  targetContract = implContract;
                  targetFunc = implFunc;
                }
              }
            }

            if (targetFunc) {
              externalLibraryPath = targetContract.filePath;
            }
          }
        }
      } else if (call.type === 'delegatecall') {
        nodeType = 'delegatecall';
      }

      // Create node for this call
      const nodeId = createNodeId();
      const sourceCode = targetFunc?.sourceCode || `// ${call.target}()\n// Source code not available`;
      const nodeHeight = estimateNodeHeight(sourceCode);

      // Determine the file path to display
      const displayFilePath = externalLibraryPath
        ? externalLibraryPath
        : targetContract.filePath;

      nodes.push({
        id: nodeId,
        type: 'codeBlock',
        position: { x, y },
        data: {
          label: call.type === 'library' ? call.target : `function ${call.target}`,
          functionName: call.target,
          sourceCode,
          startLine: targetFunc?.startLine || 1,
          type: nodeType,
          filePath: displayFilePath,
          libraryId,
        },
      });

      nodePositions.set(funcKey, { x, y });

      // Create edge from parent to this node
      edges.push({
        id: `edge-${parentNodeId}-${nodeId}`,
        source: parentNodeId,
        target: nodeId,
        type: 'default',
        style: {
          stroke: getEdgeColor(nodeType),
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: getEdgeColor(nodeType),
        },
        animated: true,
      });

      const nodeCenterY = y + nodeHeight / 2;
      const nodeBottomY = y + nodeHeight;
      updateColumnY(column, nodeBottomY);
      y = nodeBottomY + verticalGap;

      // Recursively process calls from this function
      if (targetFunc && targetFunc.calls.length > 0) {
        processCallsHorizontally(
          targetFunc.calls,
          nodeId,
          targetContract,
          graph,
          column + 1,
          nodeCenterY,
          depth + 1
        );
      }
    }
  }

  function getEdgeColor(type: 'internal' | 'library' | 'external' | 'delegatecall'): string {
    switch (type) {
      case 'library':
        return '#fbbf24'; // amber
      case 'internal':
        return '#a78bfa'; // lavender
      case 'external':
        return '#60a5fa'; // blue
      case 'delegatecall':
        return '#f87171'; // red
      default:
        return '#64748b';
    }
  }

  return { nodes, edges };
}
