'use client';

import { useCallback, useMemo, useEffect, createContext, useContext } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type OnNodesChange,
  type OnEdgesChange,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { ContractNode } from './ContractNode';
import { LibraryNode } from './LibraryNode';
import { ProxyGroupNode } from './ProxyGroupNode';
import { ProxyPatternGroupNode } from './ProxyPatternGroupNode';
import { CategoryGroupNode, categoryStyles } from './CategoryGroupNode';
import { DependencyEdge } from './DependencyEdge';
import { transformToReactFlow, type LayoutMode } from '@/utils/transformToReactFlow';
import type { CallGraph, ExternalFunction, ContractCategory } from '@/types/callGraph';

// Context for function click handler
interface DiagramContextType {
  onFunctionClick: (func: ExternalFunction, contractName: string) => void;
}

export const DiagramContext = createContext<DiagramContextType | null>(null);

export function useDiagramContext() {
  const context = useContext(DiagramContext);
  if (!context) {
    throw new Error('useDiagramContext must be used within DiagramContext.Provider');
  }
  return context;
}

interface DiagramCanvasProps {
  callGraph: CallGraph;
  selectedContract: string | null;
  selectedFunction: string | null;
  onSelectContract: (name: string | null) => void;
  onSelectFunction: (func: ExternalFunction | null) => void;
  enableCategoryGroups?: boolean;
  visibleCategories?: ContractCategory[];
  layoutMode?: LayoutMode;
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

export function DiagramCanvas({
  callGraph,
  selectedContract,
  selectedFunction,
  onSelectContract,
  onSelectFunction,
  enableCategoryGroups = true,
  visibleCategories,
  layoutMode = 'grid',
}: DiagramCanvasProps) {
  const handleFunctionClick = useCallback(
    (func: ExternalFunction, contractName: string) => {
      console.log('DiagramCanvas handleFunctionClick:', func.name, 'contract:', contractName);
      onSelectContract(contractName);
      onSelectFunction(func);
    },
    [onSelectContract, onSelectFunction]
  );

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => transformToReactFlow(callGraph, selectedContract, selectedFunction, {
      enableCategoryGroups,
      visibleCategories,
      layoutMode,
    }),
    [callGraph, selectedContract, selectedFunction, enableCategoryGroups, visibleCategories, layoutMode]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when selection changes
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

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
    (_: React.MouseEvent, node: { id: string; type?: string }) => {
      // Ignore clicks on group nodes
      if (node.type === 'proxyGroupNode' || node.type === 'categoryGroupNode' || node.type === 'proxyPatternGroupNode') return;
      onSelectContract(node.id === selectedContract ? null : node.id);
      onSelectFunction(null);
    },
    [selectedContract, onSelectContract, onSelectFunction]
  );

  const handlePaneClick = useCallback(() => {
    onSelectContract(null);
    onSelectFunction(null);
  }, [onSelectContract, onSelectFunction]);

  const contextValue = useMemo(
    () => ({ onFunctionClick: handleFunctionClick }),
    [handleFunctionClick]
  );

  return (
    <DiagramContext.Provider value={contextValue}>
      <div className="w-full h-full blueprint-grid">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={2}
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
                // Return color based on category
                const category = (node.data as { category?: string })?.category;
                if (category && category in categoryStyles) {
                  const colors: Record<string, string> = {
                    access: 'rgba(59, 130, 246, 0.3)',
                    token: 'rgba(34, 197, 94, 0.3)',
                    proxy: 'rgba(245, 158, 11, 0.3)',
                    core: 'rgba(0, 212, 170, 0.3)',
                    service: 'rgba(168, 85, 247, 0.3)',
                    storage: 'rgba(249, 115, 22, 0.3)',
                    interface: 'rgba(99, 102, 241, 0.3)',
                    library: 'rgba(234, 179, 8, 0.3)',
                    other: 'rgba(148, 163, 184, 0.3)',
                  };
                  return colors[category] || 'rgba(148, 163, 184, 0.3)';
                }
                return 'rgba(148, 163, 184, 0.3)';
              }
              return '#00d4aa';
            }}
            maskColor="rgba(10, 14, 26, 0.8)"
          />
        </ReactFlow>
      </div>
    </DiagramContext.Provider>
  );
}
