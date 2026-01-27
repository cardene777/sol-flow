import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { ArrowDownCircle, Zap, AlertTriangle, Undo2, BookOpen, Code, Shield } from 'lucide-react';
import clsx from 'clsx';

interface FlowStepNodeData {
  label: string;
  type: 'entry' | 'internal' | 'library' | 'event' | 'error' | 'condition' | 'return' | 'modifier';
  signature?: string;
  params?: string;
  details?: string[];
}

const typeStyles = {
  entry: {
    bg: 'bg-mint/10',
    border: 'border-mint/40',
    text: 'text-mint',
    icon: ArrowDownCircle,
  },
  internal: {
    bg: 'bg-lavender/10',
    border: 'border-lavender/40',
    text: 'text-lavender',
    icon: Code,
  },
  library: {
    bg: 'bg-amber/10',
    border: 'border-amber/40',
    text: 'text-amber',
    icon: BookOpen,
  },
  event: {
    bg: 'bg-coral/10',
    border: 'border-coral/40',
    text: 'text-coral',
    icon: Zap,
  },
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/40',
    text: 'text-red-500',
    icon: AlertTriangle,
  },
  condition: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/40',
    text: 'text-blue-400',
    icon: Code,
  },
  return: {
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/40',
    text: 'text-slate-400',
    icon: Undo2,
  },
  modifier: {
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/40',
    text: 'text-blue-400',
    icon: Shield,
  },
};

function FlowStepNodeComponent({ data }: NodeProps<FlowStepNodeData>) {
  const { label, type, signature, params, details } = data;
  const style = typeStyles[type];
  const Icon = style.icon;

  return (
    <div
      className={clsx(
        'px-4 py-3 rounded-lg border-2 min-w-[220px] max-w-[320px]',
        style.bg,
        style.border
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-slate-500 !w-2 !h-2 !border-0"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-slate-500 !w-2 !h-2 !border-0"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-slate-500 !w-2 !h-2 !border-0"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-slate-500 !w-2 !h-2 !border-0"
      />

      <div className="flex items-start gap-2">
        <Icon className={clsx('w-4 h-4 mt-0.5 flex-shrink-0', style.text)} />
        <div className="flex-1 min-w-0">
          {/* Function name */}
          <div className={clsx('font-mono text-sm font-medium', style.text)}>
            {label}
          </div>

          {/* Parameters */}
          {params && (
            <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate" title={params}>
              ({params})
            </div>
          )}

          {/* Signature/type */}
          {signature && (
            <div className="text-[10px] text-slate-500 mt-0.5 italic">
              {signature}
            </div>
          )}

          {/* Details */}
          {details && details.length > 0 && (
            <div className="mt-2 pt-2 border-t border-white/10 space-y-0.5">
              {details.map((detail, i) => (
                <div key={i} className="text-[10px] text-slate-400 font-mono">
                  {detail}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const FlowStepNode = memo(FlowStepNodeComponent);
