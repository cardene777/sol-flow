'use client';

import { useCallback, useMemo, useEffect, useState, createContext, useContext, useRef, useImperativeHandle, forwardRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  getNodesBounds,
  type OnNodesChange,
  type OnEdgesChange,
  type Connection,
  type Edge,
} from 'reactflow';
import { toPng, toSvg } from 'html-to-image';
import 'reactflow/dist/style.css';

// Suppress React Flow's false positive warning about nodeTypes/edgeTypes in development
// This occurs due to React StrictMode's double-rendering, not actual instability
// See: https://reactflow.dev/error#002
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    const message = args[0];
    if (typeof message === 'string' && message.includes('[React Flow]') && message.includes('nodeTypes or edgeTypes')) {
      return; // Suppress this specific warning
    }
    originalWarn.apply(console, args);
  };
}

import { ContractNode } from './ContractNode';
import { LibraryNode } from './LibraryNode';
import { ProxyGroupNode } from './ProxyGroupNode';
import { ProxyPatternGroupNode } from './ProxyPatternGroupNode';
import { CategoryGroupNode, categoryStyles, getCategoryStyle } from './CategoryGroupNode';
import { DependencyEdge } from './DependencyEdge';
import { EdgeTypeModal } from './EdgeTypeModal';
import { TempEdgesBadge } from './TempEdgesBadge';
import { transformToReactFlow, type LayoutMode } from '@/utils/transformToReactFlow';
import type { CallGraph, ExternalFunction, ContractCategory, DependencyType, UserEdge } from '@/types/callGraph';

// Context for function click handler, height measurement, and contract detail
interface DiagramContextType {
  onFunctionClick: (func: ExternalFunction, contractName: string, contractFilePath?: string) => void;
  onHeightMeasured?: (contractName: string, height: number) => void;
  onContractDetailClick?: (contract: import('@/types/callGraph').Contract) => void;
}

export const DiagramContext = createContext<DiagramContextType | null>(null);

export function useDiagramContext() {
  const context = useContext(DiagramContext);
  if (!context) {
    throw new Error('useDiagramContext must be used within DiagramContext.Provider');
  }
  return context;
}

export interface DiagramCanvasHandle {
  exportAsPng: (filename?: string) => Promise<void>;
  exportAsSvg: (filename?: string) => Promise<void>;
  focusNode: (nodeId: string) => void;
}

export interface TempEdge {
  id: string;
  from: string;
  to: string;
  type: DependencyType;
  sourceHandle?: string;
  targetHandle?: string;
}

interface DiagramCanvasProps {
  callGraph: CallGraph;
  selectedContract: string | null;
  selectedFunction: string | null;
  onSelectContract: (name: string | null, filePath?: string | null) => void;
  onSelectFunction: (func: ExternalFunction | null) => void;
  enableCategoryGroups?: boolean;
  visibleCategories?: ContractCategory[];
  layoutMode?: LayoutMode;
  // Edit mode props
  isEditMode?: boolean;
  isLibrary?: boolean;
  tempEdges?: TempEdge[];
  onAddTempEdge?: (edge: TempEdge) => void;
  onClearTempEdges?: () => void;
  onAddUserEdge?: (edge: UserEdge) => void;
  onDeleteEdge?: (edgeId: string) => void;
  // Library contracts visibility
  showLibraryContracts?: boolean;
  // Contract detail modal
  onContractDetailClick?: (contract: import('@/types/callGraph').Contract) => void;
}

const nodeTypes = {
  contractNode: ContractNode,
  libraryNode: LibraryNode,
  proxyGroupNode: ProxyGroupNode,
  proxyPatternGroupNode: ProxyPatternGroupNode,
  categoryGroupNode: CategoryGroupNode,
};

const edgeTypes = {
  dependencyEdge: DependencyEdge,
};

// Inner component that uses useReactFlow (must be inside ReactFlowProvider)
const DiagramCanvasInner = forwardRef<DiagramCanvasHandle, DiagramCanvasProps>(function DiagramCanvasInner({
  callGraph,
  selectedContract,
  selectedFunction,
  onSelectContract,
  onSelectFunction,
  enableCategoryGroups = true,
  visibleCategories,
  layoutMode = 'grid',
  isEditMode = false,
  isLibrary = false,
  tempEdges = [],
  onAddTempEdge,
  onClearTempEdges,
  onAddUserEdge,
  onDeleteEdge,
  showLibraryContracts = false,
  onContractDetailClick,
}, ref) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { getNodes, setCenter, getZoom } = useReactFlow();

  // State for edge type modal
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
  const [showEdgeTypeModal, setShowEdgeTypeModal] = useState(false);

  // State for height measurement and layout
  // Use a key to track which callGraph the measurements belong to (include showLibraryContracts to reset when toggled)
  const currentCallGraphId = `${callGraph.projectName}-${callGraph.contracts.length}-${callGraph.generatedAt}-lib:${showLibraryContracts}`;
  const [measurementState, setMeasurementState] = useState<{
    callGraphId: string;
    heights: Map<string, number>;
    phase: 'measuring' | 'ready';
  }>({
    callGraphId: '',
    heights: new Map(),
    phase: 'measuring',
  });

  // Count contracts that will be rendered as ContractNode (must match transformToReactFlow filtering)
  const contractNodeCount = useMemo(() => {
    let contracts = callGraph.contracts.filter(c => {
      if (c.kind === 'contract' || c.kind === 'abstract') return true;
      if (c.kind === 'library' && showLibraryContracts) return true;
      return false;
    });
    // Filter out external library contracts unless showLibraryContracts is true
    if (!showLibraryContracts) {
      contracts = contracts.filter(c => !c.isExternalLibrary);
    }
    if (visibleCategories) {
      contracts = contracts.filter(c => visibleCategories.includes(c.category));
    }
    return contracts.length;
  }, [callGraph.contracts, visibleCategories, showLibraryContracts]);

  // Check if we have valid measurements for current callGraph
  const isCurrentMeasurement = measurementState.callGraphId === currentCallGraphId;
  const isReady = isCurrentMeasurement && measurementState.phase === 'ready';
  const isLoading = !isReady;

  // Callback for nodes to report their measured heights
  const handleHeightMeasured = useCallback((contractName: string, height: number) => {
    setMeasurementState(prev => {
      // Only accept measurements for current callGraph
      if (prev.callGraphId !== currentCallGraphId) {
        return prev;
      }
      const newHeights = new Map(prev.heights);
      newHeights.set(contractName, height);
      return { ...prev, heights: newHeights };
    });
  }, [currentCallGraphId]);

  // Reset when callGraph changes
  useEffect(() => {
    if (measurementState.callGraphId !== currentCallGraphId) {
      setMeasurementState({
        callGraphId: currentCallGraphId,
        heights: new Map(),
        phase: 'measuring',
      });
    }
  }, [currentCallGraphId, measurementState.callGraphId]);

  // Check if measurement is complete
  useEffect(() => {
    if (isCurrentMeasurement && measurementState.phase === 'measuring') {
      const measuredCount = measurementState.heights.size;
      if (contractNodeCount === 0 || measuredCount >= contractNodeCount) {
        setMeasurementState(prev => ({ ...prev, phase: 'ready' }));
      }
    }
  }, [measurementState.heights.size, contractNodeCount, measurementState.phase, isCurrentMeasurement]);

  // Timeout fallback
  useEffect(() => {
    if (isCurrentMeasurement && measurementState.phase === 'measuring') {
      const timeout = setTimeout(() => {
        setMeasurementState(prev => ({ ...prev, phase: 'ready' }));
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [measurementState.phase, isCurrentMeasurement]);

  const handleFunctionClick = useCallback(
    (func: ExternalFunction, contractName: string, contractFilePath?: string) => {
      onSelectContract(contractName, contractFilePath);
      onSelectFunction(func);
    },
    [onSelectContract, onSelectFunction]
  );

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => {
      // Use measured heights if we have any for current callGraph (don't wait for all measurements)
      const shouldUseMeasuredHeights = isCurrentMeasurement && measurementState.heights.size > 0;

      return transformToReactFlow(callGraph, selectedContract, selectedFunction, {
        enableCategoryGroups,
        visibleCategories,
        layoutMode,
        measuredHeights: shouldUseMeasuredHeights ? measurementState.heights : undefined,
        showLibraryContracts,
      });
    },
    [callGraph, selectedContract, selectedFunction, enableCategoryGroups, visibleCategories, layoutMode, isCurrentMeasurement, measurementState.heights, showLibraryContracts]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Create temp edges for ReactFlow
  const tempEdgesForReactFlow: Edge[] = useMemo(() => {
    return tempEdges.map((te) => ({
      id: `temp-${te.id}`,
      source: te.from,
      target: te.to,
      sourceHandle: te.sourceHandle,
      targetHandle: te.targetHandle,
      type: 'dependencyEdge',
      zIndex: 1000, // Above nodes
      data: {
        type: te.type,
        isTemporary: true,
      },
      style: {
        stroke: '#ef4444', // red-500
        strokeDasharray: '5,5',
      },
    }));
  }, [tempEdges]);

  // Compute combined edges (initialEdges + temp edges) with onDelete callback
  const combinedEdges = useMemo(() => {
    const addOnDelete = (edge: Edge): Edge => ({
      ...edge,
      data: {
        ...edge.data,
        onDelete: onDeleteEdge,
      },
    });
    return [...initialEdges.map(addOnDelete), ...tempEdgesForReactFlow.map(addOnDelete)];
  }, [initialEdges, tempEdgesForReactFlow, onDeleteEdge]);

  // Update nodes when selection changes
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  // Handle connection (when user draws a line)
  const handleConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    // Don't allow self-connections
    if (connection.source === connection.target) return;
    // Only allow connections from actual handles (not from node body)
    if (!connection.sourceHandle || !connection.targetHandle) return;

    const isTemp = !isEditMode || isLibrary;

    if (isTemp) {
      // For temporary edges, directly add with 'uses' type (no modal)
      onAddTempEdge?.({
        id: `user-${Date.now()}`,
        from: connection.source,
        to: connection.target,
        type: 'uses',
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
      });
    } else {
      // For edit mode, show modal to select edge type
      setPendingConnection(connection);
      setShowEdgeTypeModal(true);
    }
  }, [isEditMode, isLibrary, onAddTempEdge]);

  // Handle edge type selection from modal (only called in edit mode)
  const handleEdgeTypeSelect = useCallback((type: DependencyType) => {
    if (!pendingConnection?.source || !pendingConnection?.target) return;

    const newEdge = {
      id: `user-${Date.now()}`,
      from: pendingConnection.source,
      to: pendingConnection.target,
      type,
      sourceHandle: pendingConnection.sourceHandle || undefined,
      targetHandle: pendingConnection.targetHandle || undefined,
      createdAt: new Date().toISOString(),
    };

    // Add as permanent user edge
    onAddUserEdge?.(newEdge);

    setPendingConnection(null);
    setShowEdgeTypeModal(false);
  }, [pendingConnection, onAddUserEdge]);

  // Handle edge click for deletion
  const handleEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    // Temp edges can always be deleted by clicking
    if (edge.id.startsWith('temp-')) {
      onDeleteEdge?.(edge.id);
      return;
    }

    // For other edges, only allow deletion in edit mode for user projects
    if (!isEditMode || isLibrary) return;

    // Delete user-added edges
    if (edge.id.startsWith('user-')) {
      onDeleteEdge?.(edge.id);
    }
  }, [isEditMode, isLibrary, onDeleteEdge]);

  // Export functions
  const exportImage = useCallback(async (format: 'png' | 'svg', filename?: string) => {
    const viewportElement = reactFlowWrapper.current?.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewportElement) {
      console.error('Could not find React Flow viewport');
      return;
    }

    const currentNodes = getNodes();
    if (currentNodes.length === 0) {
      console.error('No nodes to export');
      return;
    }

    // Get bounds of all nodes
    const nodesBounds = getNodesBounds(currentNodes);

    // Add padding around the content
    const padding = 80;

    // Use zoom = 1 to render elements at full size
    const zoom = 1;

    // Image dimensions = actual node bounds + padding (at full zoom)
    const imageWidth = nodesBounds.width + padding * 2;
    const imageHeight = nodesBounds.height + padding * 2;

    // Calculate translation to center nodes in the image
    // We need to offset by the negative of the bounds origin, plus padding
    const translateX = -nodesBounds.x + padding;
    const translateY = -nodesBounds.y + padding;

    // Export options
    const exportFn = format === 'png' ? toPng : toSvg;
    const extension = format === 'png' ? 'png' : 'svg';
    const defaultFilename = `${callGraph.projectName.replace(/\s+/g, '-').toLowerCase()}-diagram.${extension}`;

    try {
      const dataUrl = await exportFn(viewportElement, {
        backgroundColor: '#0a0e1a', // navy-900
        width: imageWidth,
        height: imageHeight,
        pixelRatio: format === 'png' ? 1 : 1,
        cacheBust: true,
        style: {
          width: `${imageWidth}px`,
          height: `${imageHeight}px`,
          transform: `translate(${translateX}px, ${translateY}px) scale(${zoom})`,
        },
      });

      // Download
      const link = document.createElement('a');
      link.download = filename || defaultFilename;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error(`Failed to export as ${format}:`, error);
    }
  }, [getNodes, callGraph.projectName]);

  // Focus on a specific node by centering the view
  const focusNode = useCallback((nodeId: string) => {
    const nodes = getNodes();
    const targetNode = nodes.find(n => n.id === nodeId);
    if (targetNode) {
      // Calculate absolute position by traversing parent chain
      // Nodes inside groups have positions relative to their parent
      let absoluteX = targetNode.position.x;
      let absoluteY = targetNode.position.y;

      // Traverse up the parent chain to get absolute position
      let currentNode = targetNode;
      while (currentNode.parentId) {
        const parentNode = nodes.find(n => n.id === currentNode.parentId);
        if (parentNode) {
          absoluteX += parentNode.position.x;
          absoluteY += parentNode.position.y;
          currentNode = parentNode;
        } else {
          break;
        }
      }

      const x = absoluteX + (targetNode.width || 200) / 2;
      const y = absoluteY + (targetNode.height || 100) / 2;
      const zoom = Math.max(getZoom(), 0.8); // Ensure minimum zoom level
      setCenter(x, y, { zoom, duration: 500 });
    }
  }, [getNodes, setCenter, getZoom]);

  // Expose functions via ref
  useImperativeHandle(ref, () => ({
    exportAsPng: (filename?: string) => exportImage('png', filename),
    exportAsSvg: (filename?: string) => exportImage('svg', filename),
    focusNode,
  }), [exportImage, focusNode]);

  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);
    },
    [onNodesChange]
  );

  const handleEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string; type?: string; data?: { contract?: { filePath?: string } } }) => {
      // Ignore clicks on group nodes
      if (node.type === 'proxyGroupNode' || node.type === 'categoryGroupNode' || node.type === 'proxyPatternGroupNode') return;
      const filePath = node.data?.contract?.filePath;
      onSelectContract(node.id === selectedContract ? null : node.id, filePath);
      onSelectFunction(null);
    },
    [selectedContract, onSelectContract, onSelectFunction]
  );

  const handlePaneClick = useCallback(() => {
    onSelectContract(null, null);
    onSelectFunction(null);
  }, [onSelectContract, onSelectFunction]);

  const contextValue = useMemo(
    () => ({
      onFunctionClick: handleFunctionClick,
      onHeightMeasured: measurementState.phase === 'measuring' ? handleHeightMeasured : undefined,
      onContractDetailClick,
    }),
    [handleFunctionClick, handleHeightMeasured, measurementState.phase, onContractDetailClick]
  );

  return (
    <DiagramContext.Provider value={contextValue}>
      {/* Loading overlay - show until layout is ready */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-navy-900/90 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              {/* Outer ring */}
              <div className="absolute inset-0 border-4 border-mint/20 rounded-full" />
              {/* Spinning ring */}
              <div className="absolute inset-0 border-4 border-transparent border-t-mint rounded-full animate-spin" />
              {/* Inner pulse */}
              <div className="absolute inset-3 bg-mint/10 rounded-full animate-pulse" />
            </div>
            <div className="text-mint font-medium text-sm tracking-wide">
              Rendering diagram...
            </div>
            <div className="text-slate-500 text-xs">
              {measurementState.heights.size} / {contractNodeCount} contracts
            </div>
          </div>
        </div>
      )}
      <div
        ref={reactFlowWrapper}
        className="w-full h-full blueprint-grid transition-opacity duration-300"
        style={{ opacity: isReady ? 1 : 0 }}
      >
        <ReactFlow
          nodes={nodes}
          edges={combinedEdges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          onConnect={handleConnect}
          onEdgeClick={handleEdgeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.01}
          maxZoom={2}
          connectionLineStyle={{ stroke: isEditMode && !isLibrary ? '#00d4aa' : '#ef4444', strokeDasharray: isEditMode && !isLibrary ? 'none' : '5,5' }}
          defaultEdgeOptions={{
            type: 'dependencyEdge',
          }}
        >
          <Background
            color="rgba(64, 156, 255, 0.06)"
            gap={20}
            size={1}
          />
          <Controls
            className="!bg-navy-700 !border-navy-500 !shadow-lg [&>button]:!bg-navy-600 [&>button]:!border-navy-500 [&>button]:!text-slate-300 [&>button:hover]:!bg-navy-500"
            showInteractive={false}
          />
          <MiniMap
            className="!bg-navy-800 !border-navy-600"
            nodeColor={(node) => {
              if (node.type === 'libraryNode') return '#fbbf24';
              if (node.type === 'proxyGroupNode') return 'rgba(16, 185, 129, 0.3)';
              if (node.type === 'proxyPatternGroupNode') return 'rgba(16, 185, 129, 0.2)';
              if (node.type === 'categoryGroupNode') {
                // Return color based on category - use dynamic color generation
                const category = (node.data as { category?: string })?.category;
                if (category) {
                  const style = getCategoryStyle(category);
                  // Convert borderColor to rgba with 0.3 opacity
                  return style.bg;
                }
                return 'rgba(148, 163, 184, 0.3)';
              }
              return '#00d4aa';
            }}
            maskColor="rgba(10, 14, 26, 0.8)"
          />
        </ReactFlow>

        {/* Temp Edges Badge */}
        {tempEdges.length > 0 && onClearTempEdges && (
          <TempEdgesBadge count={tempEdges.length} onClearAll={onClearTempEdges} />
        )}
      </div>

      {/* Edge Type Modal */}
      {showEdgeTypeModal && pendingConnection && (
        <EdgeTypeModal
          isOpen={showEdgeTypeModal}
          onClose={() => {
            setShowEdgeTypeModal(false);
            setPendingConnection(null);
          }}
          onSelect={handleEdgeTypeSelect}
          fromContract={pendingConnection.source || ''}
          toContract={pendingConnection.target || ''}
          isTemporary={!isEditMode || isLibrary}
        />
      )}
    </DiagramContext.Provider>
  );
});

// Outer wrapper that provides ReactFlowProvider
export const DiagramCanvas = forwardRef<DiagramCanvasHandle, DiagramCanvasProps>(
  function DiagramCanvas(props, ref) {
    // Generate a unique key for the callGraph to force complete remount on project switch
    // Key is on inner component to preserve ReactFlowProvider's nodeTypes/edgeTypes reference check
    const callGraphKey = `${props.callGraph.projectName}-${props.callGraph.contracts.length}-${props.callGraph.generatedAt}`;

    return (
      <ReactFlowProvider>
        <DiagramCanvasInner key={callGraphKey} {...props} ref={ref} />
      </ReactFlowProvider>
    );
  }
);
