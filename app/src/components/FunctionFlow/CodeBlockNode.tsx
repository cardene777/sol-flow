'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { ExternalLink, Github } from 'lucide-react';
import clsx from 'clsx';
import { getGitHubUrlForPath, isExternalLibrary } from '@/config/remappings';

interface CodeBlockNodeData {
  label: string;
  functionName: string;
  sourceCode: string;
  startLine: number;
  type: 'entry' | 'internal' | 'library' | 'external';
  filePath?: string;
}

const typeStyles = {
  entry: {
    border: 'border-mint/40',
    headerBg: 'bg-mint/20',
    headerText: 'text-mint',
  },
  internal: {
    border: 'border-lavender/40',
    headerBg: 'bg-lavender/20',
    headerText: 'text-lavender',
  },
  library: {
    border: 'border-amber/40',
    headerBg: 'bg-amber/20',
    headerText: 'text-amber',
  },
  external: {
    border: 'border-blue-400/40',
    headerBg: 'bg-blue-400/20',
    headerText: 'text-blue-400',
  },
};

// Token types for syntax highlighting
type TokenType = 'keyword' | 'type' | 'function' | 'string' | 'number' | 'comment' | 'error' | 'operator' | 'text';

interface Token {
  type: TokenType;
  value: string;
}

// Tokenize a line of Solidity code
function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let remaining = line;

  const keywords = /^(function|returns|return|if|else|for|while|require|revert|emit|internal|external|public|private|view|pure|virtual|override|memory|storage|calldata|delete|new|this|super|unchecked)\b/;
  const types = /^(address|uint256|uint128|uint64|uint32|uint8|int256|int128|bool|string|bytes|bytes32|bytes4|mapping)\b/;
  const errorEvent = /^([A-Z][a-zA-Z0-9_]*)\b/;
  const functionCall = /^([a-z_][a-zA-Z0-9_]*)\s*(?=\()/;
  const identifier = /^([a-zA-Z_][a-zA-Z0-9_]*)/;
  const number = /^(\d+)/;
  const stringLit = /^(".*?"|'.*?')/;
  const comment = /^(\/\/.*$)/;
  const operator = /^([=!<>+\-*/%&|^~]+|[{}()\[\];,.])/;
  const whitespace = /^(\s+)/;

  while (remaining.length > 0) {
    let match: RegExpMatchArray | null;

    if ((match = remaining.match(comment))) {
      tokens.push({ type: 'comment', value: match[1] });
      remaining = remaining.slice(match[1].length);
    } else if ((match = remaining.match(stringLit))) {
      tokens.push({ type: 'string', value: match[1] });
      remaining = remaining.slice(match[1].length);
    } else if ((match = remaining.match(keywords))) {
      tokens.push({ type: 'keyword', value: match[1] });
      remaining = remaining.slice(match[1].length);
    } else if ((match = remaining.match(types))) {
      tokens.push({ type: 'type', value: match[1] });
      remaining = remaining.slice(match[1].length);
    } else if ((match = remaining.match(errorEvent))) {
      tokens.push({ type: 'error', value: match[1] });
      remaining = remaining.slice(match[1].length);
    } else if ((match = remaining.match(functionCall))) {
      tokens.push({ type: 'function', value: match[1] });
      remaining = remaining.slice(match[1].length);
    } else if ((match = remaining.match(number))) {
      tokens.push({ type: 'number', value: match[1] });
      remaining = remaining.slice(match[1].length);
    } else if ((match = remaining.match(identifier))) {
      tokens.push({ type: 'text', value: match[1] });
      remaining = remaining.slice(match[1].length);
    } else if ((match = remaining.match(operator))) {
      tokens.push({ type: 'operator', value: match[1] });
      remaining = remaining.slice(match[1].length);
    } else if ((match = remaining.match(whitespace))) {
      tokens.push({ type: 'text', value: match[1] });
      remaining = remaining.slice(match[1].length);
    } else {
      tokens.push({ type: 'text', value: remaining[0] });
      remaining = remaining.slice(1);
    }
  }

  return tokens;
}

const tokenColors: Record<TokenType, string> = {
  keyword: 'text-purple-400',
  type: 'text-cyan-400',
  function: 'text-yellow-300',
  string: 'text-green-400',
  number: 'text-orange-400',
  comment: 'text-slate-500 italic',
  error: 'text-red-400',
  operator: 'text-slate-400',
  text: 'text-slate-300',
};

function HighlightedLine({ line }: { line: string }) {
  const tokens = tokenizeLine(line);

  return (
    <>
      {tokens.map((token, i) => (
        <span key={i} className={tokenColors[token.type]}>
          {token.value}
        </span>
      ))}
    </>
  );
}

function CodeBlockNodeComponent({ data }: NodeProps<CodeBlockNodeData>) {
  const { label, functionName, sourceCode, startLine, type, filePath } = data;
  const style = typeStyles[type];
  const lines = sourceCode.split('\n');

  return (
    <div
      className={clsx(
        'rounded-lg border bg-navy-900/95 shadow-2xl min-w-[400px] max-w-[600px]',
        style.border
      )}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-slate-500 !w-3 !h-3 !border-2 !border-navy-800"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-slate-500 !w-3 !h-3 !border-2 !border-navy-800"
      />

      {/* Header */}
      <div className={clsx('px-4 py-2 rounded-t-lg border-b border-white/10', style.headerBg)}>
        <div className={clsx('font-mono font-semibold text-sm', style.headerText)}>
          {label}
        </div>
        {filePath && (
          <div className="text-[10px] text-slate-500 mt-0.5 truncate">
            {filePath}
          </div>
        )}
      </div>

      {/* Code block - scrollable horizontally with selectable text */}
      {/* nowheel prevents ReactFlow from capturing scroll events */}
      <div className="overflow-x-auto nowheel" style={{ userSelect: 'text' }}>
        <pre className="text-xs leading-relaxed min-w-max">
          <code className="block" style={{ userSelect: 'text', cursor: 'text' }}>
            {lines.map((line, index) => (
              <div key={index} className="flex hover:bg-white/5">
                {/* Line number - not selectable, sticky on horizontal scroll */}
                <span
                  className="text-slate-600 text-right pr-4 pl-3 py-0.5 border-r border-white/5 min-w-[50px] sticky left-0 bg-navy-900 z-10"
                  style={{ userSelect: 'none' }}
                >
                  {startLine + index}
                </span>
                {/* Code - selectable for copying */}
                <span className="pl-4 pr-4 py-0.5 whitespace-pre" style={{ userSelect: 'text' }}>
                  <HighlightedLine line={line} />
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/10 flex justify-end">
        {filePath && isExternalLibrary(filePath) ? (
          <a
            href={getGitHubUrlForPath(filePath, startLine) || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] text-mint hover:text-mint/80 transition-colors bg-mint/10 hover:bg-mint/20 px-2 py-1 rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <Github className="w-3 h-3" />
            View on GitHub
          </a>
        ) : (
          <button
            className="flex items-center gap-1.5 text-[10px] text-mint hover:text-mint/80 transition-colors bg-mint/10 hover:bg-mint/20 px-2 py-1 rounded"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Go to source:', filePath, startLine);
            }}
          >
            <ExternalLink className="w-3 h-3" />
            Go to source
          </button>
        )}
      </div>
    </div>
  );
}

export const CodeBlockNode = memo(CodeBlockNodeComponent);
