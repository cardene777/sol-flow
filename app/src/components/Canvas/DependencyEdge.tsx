'use client';

import { memo } from 'react';
import { EdgeLabelRenderer, getBezierPath, type EdgeProps } from 'reactflow';
import clsx from 'clsx';

interface DependencyEdgeData {
  type: 'inherits' | 'implements' | 'uses' | 'delegatecall' | 'registers' | 'imports';
  label?: string;
  functions?: string[];
  isBundled?: boolean;
  bundleCount?: number;
  bundleSources?: string[];
  isSelected?: boolean;
  sourceOffset?: number;  // Offset for source handle (to prevent overlapping lines)
  targetOffset?: number;  // Offset for target handle
}

function DependencyEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  style,
}: EdgeProps<DependencyEdgeData>) {
  // Apply offsets to prevent overlapping lines from the same node
  const sourceOffset = data?.sourceOffset || 0;
  const targetOffset = data?.targetOffset || 0;

  // Offset perpendicular to the edge direction
  // For horizontal edges (left/right), offset vertically
  // For vertical edges (top/bottom), offset horizontally
  const isHorizontalSource = sourcePosition === 'left' || sourcePosition === 'right';
  const isHorizontalTarget = targetPosition === 'left' || targetPosition === 'right';

  const adjustedSourceX = isHorizontalSource ? sourceX : sourceX + sourceOffset;
  const adjustedSourceY = isHorizontalSource ? sourceY + sourceOffset : sourceY;
  const adjustedTargetX = isHorizontalTarget ? targetX : targetX + targetOffset;
  const adjustedTargetY = isHorizontalTarget ? targetY + targetOffset : targetY;

  // Use bezier path for smooth curved edges
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: adjustedSourceX,
    sourceY: adjustedSourceY,
    sourcePosition,
    targetX: adjustedTargetX,
    targetY: adjustedTargetY,
    targetPosition,
    curvature: 0.4,  // Higher curvature for more pronounced curves
  });

  const edgeType = data?.type || 'uses';
  const isBundled = data?.isBundled || false;
  const isSelected = data?.isSelected || selected || false;

  const strokeColors: Record<string, string> = {
    inherits: '#60a5fa',
    implements: '#818cf8',
    uses: '#fbbf24',
    delegatecall: '#f472b6',
    registers: '#a78bfa',
    imports: '#94a3b8',
  };

  const strokeColor = (style?.stroke as string) || strokeColors[edgeType] || '#fbbf24';

  // Selected edges are much thicker and fully opaque
  const strokeWidth = isSelected ? 4 : ((style?.strokeWidth as number) || 1.5);
  const opacity = isSelected ? 1 : ((style?.opacity as number) || 0.6);
  const strokeDasharray = (style?.strokeDasharray as string) || undefined;

  const isDashed = strokeDasharray || edgeType === 'uses' || edgeType === 'delegatecall' || edgeType === 'registers' || edgeType === 'imports';

  // Don't show label for bundled edges with low counts (reduces clutter)
  const showLabel = isBundled ? (data?.bundleCount || 0) >= 2 : false;

  // For selected edges, use bright color
  const finalStrokeColor = isSelected ? '#00ff88' : strokeColor;

  return (
    <>
      {/* Shadow/glow effect for selected edges */}
      {isSelected && (
        <>
          {/* Outer glow */}
          <path
            d={edgePath}
            fill="none"
            stroke={finalStrokeColor}
            strokeWidth={strokeWidth + 8}
            strokeOpacity={0.2}
            strokeLinecap="round"
          />
          {/* Inner glow */}
          <path
            d={edgePath}
            fill="none"
            stroke={finalStrokeColor}
            strokeWidth={strokeWidth + 4}
            strokeOpacity={0.4}
            strokeLinecap="round"
          />
        </>
      )}

      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={finalStrokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={isSelected ? '16,8' : (isDashed ? (strokeDasharray || '5,5') : undefined)}
        strokeOpacity={opacity}
        strokeLinecap="round"
        style={isSelected ? {
          animation: 'dashFlow 0.5s linear infinite',
        } : undefined}
      />

      {/* Edge Label */}
      {showLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
              opacity: isBundled ? 0.8 : 1,
            }}
            className={clsx(
              'px-2 py-0.5 rounded text-[10px] font-medium',
              'bg-navy-700 border',
              edgeType === 'inherits' && 'text-blue-400 border-blue-500/30',
              edgeType === 'implements' && 'text-indigo-400 border-indigo-500/30',
              edgeType === 'uses' && 'text-amber border-amber/30',
              edgeType === 'delegatecall' && 'text-pink-400 border-pink-500/30',
              edgeType === 'registers' && 'text-violet-400 border-violet-500/30',
              edgeType === 'imports' && 'text-slate-400 border-slate-500/30',
              isBundled && 'bg-navy-800'
            )}
          >
            {data?.label || edgeType}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const DependencyEdge = memo(DependencyEdgeComponent);
