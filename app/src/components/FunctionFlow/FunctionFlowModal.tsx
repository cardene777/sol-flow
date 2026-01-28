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
  onClose: () => void;
}

const nodeTypes = {
  codeBlock: CodeBlockNode,
};

function FunctionFlowContent({ func, contract, callGraph, onClose }: FunctionFlowModalProps) {
  const { fitView } = useReactFlow();
  const [isFullscreen, setIsFullscreen] = useState(true);

  const { nodes, edges } = useMemo(() => {
    return buildFlowGraph(func, contract, callGraph);
  }, [func, contract, callGraph]);

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
            elementsSelectable={true}
            panOnDrag
            zoomOnScroll
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: false,
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
  callGraph: CallGraph
): { nodes: Node<CodeBlockNodeData>[]; edges: Edge[] } {
  // Debug: Log what we're processing
  console.log('[buildFlowGraph] Entry:', {
    functionName: func.name,
    contractName: contract.name,
    callsCount: func.calls?.length || 0,
    calls: func.calls?.map(c => ({ target: c.target, type: c.type, targetType: c.targetType })),
  });

  const nodes: Node<CodeBlockNodeData>[] = [];
  const edges: Edge[] = [];

  let nodeIndex = 0;
  const visitedFunctions = new Set<string>();
  const nodePositions = new Map<string, { x: number; y: number }>();

  // Layout configuration - spread horizontally like the reference image
  const nodeWidth = 500;
  const horizontalGap = 150;
  const verticalGap = 100;

  // Track columns for horizontal layout
  let currentColumn = 0;
  const columnOccupancy = new Map<number, number>(); // column -> max Y used

  const createNodeId = () => `node-${nodeIndex++}`;

  const getColumnY = (column: number): number => {
    return columnOccupancy.get(column) || 0;
  };

  const updateColumnY = (column: number, y: number, height: number) => {
    columnOccupancy.set(column, y + height + verticalGap);
  };

  const estimateNodeHeight = (code: string): number => {
    const lines = code.split('\n').length;
    return Math.max(150, lines * 20 + 80); // 20px per line + header/footer
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
    },
  });

  nodePositions.set(`${contract.name}.${func.name}`, { x: entryX, y: entryY });
  updateColumnY(0, entryY, entryHeight);
  visitedFunctions.add(`${contract.name}.${func.name}`);

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
      const funcKey = `${call.type === 'library' ? call.target : currentContract.name + '.' + call.target}`;

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
          library = graph.contracts.find(c =>
            c.name === actualName ||
            c.name === libNameOrAlias ||
            c.name === `${libNameOrAlias}Lib` ||
            c.name.toLowerCase() === actualName.toLowerCase() ||
            c.name.toLowerCase() === libNameOrAlias.toLowerCase()
          );
        }

        if (library) {
          targetContract = library;
          // Look in both internal and external functions
          targetFunc = library.internalFunctions.find(f => f.name === funcName)
            || library.externalFunctions.find(f => f.name === funcName);
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
        targetFunc = currentContract.internalFunctions.find(f => f.name === call.target)
          || currentContract.externalFunctions.find(f => f.name === call.target);
        nodeType = 'internal';
      } else if (call.type === 'external') {
        nodeType = 'external';

        // Debug: Log external call resolution
        console.log('[FunctionFlowModal] External call:', {
          target: call.target,
          targetType: call.targetType,
          availableContracts: graph.contracts.map(c => c.name),
        });

        // Try to resolve external call using targetType (e.g., ITeleporterMessenger)
        if (call.targetType) {
          const funcName = call.target.includes('.') ? call.target.split('.')[1] : call.target;

          let externalContract: Contract | undefined;

          // PRIORITY 1: If type starts with 'I' (interface), try to find implementation first
          // e.g., ITeleporterMessenger -> TeleporterMessenger
          if (call.targetType.startsWith('I') && call.targetType[1] === call.targetType[1]?.toUpperCase()) {
            const implName = call.targetType.slice(1); // Remove 'I' prefix
            externalContract = graph.contracts.find(c => c.name === implName);
          }

          // PRIORITY 2: Fall back to exact type name match
          if (!externalContract) {
            externalContract = graph.contracts.find(c => c.name === call.targetType);
          }

          // PRIORITY 3: If found but no source code for function, try implementation again
          if (externalContract) {
            console.log('[FunctionFlowModal] Found contract:', {
              name: externalContract.name,
              kind: externalContract.kind,
              funcName,
            });
            targetContract = externalContract;
            targetFunc = externalContract.externalFunctions.find(f => f.name === funcName)
              || externalContract.internalFunctions.find(f => f.name === funcName);

            // If function found but no source code (interface), try to find implementation
            if (targetFunc && !targetFunc.sourceCode && externalContract.kind === 'interface') {
              const implName = call.targetType?.startsWith('I') ? call.targetType.slice(1) : call.targetType;
              const implContract = graph.contracts.find(c => c.name === implName && c.kind !== 'interface');
              if (implContract) {
                const implFunc = implContract.externalFunctions.find(f => f.name === funcName)
                  || implContract.internalFunctions.find(f => f.name === funcName);
                if (implFunc?.sourceCode) {
                  targetContract = implContract;
                  targetFunc = implFunc;
                }
              }
            }

            console.log('[FunctionFlowModal] Found function:', {
              found: !!targetFunc,
              hasSourceCode: !!targetFunc?.sourceCode,
              sourceCodeLength: targetFunc?.sourceCode?.length || 0,
            });

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
        },
      });

      nodePositions.set(funcKey, { x, y });

      // Create edge from parent to this node
      edges.push({
        id: `edge-${parentNodeId}-${nodeId}`,
        source: parentNodeId,
        target: nodeId,
        type: 'smoothstep',
        style: {
          stroke: getEdgeColor(nodeType),
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: getEdgeColor(nodeType),
        },
        animated: nodeType === 'library',
      });

      const nodeCenterY = y + nodeHeight / 2;
      y += nodeHeight + verticalGap;
      updateColumnY(column, y - verticalGap - nodeHeight, nodeHeight);

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
