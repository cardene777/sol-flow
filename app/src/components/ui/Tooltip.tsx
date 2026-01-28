'use client';

import { useState, useRef, useEffect, useCallback, ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export function Tooltip({ children, content, position = 'bottom', delay = 200 }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return null;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const gap = 8;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - gap;
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + gap;
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'left':
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        left = triggerRect.left - tooltipRect.width - gap;
        break;
      case 'right':
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        left = triggerRect.right + gap;
        break;
    }

    // Keep within viewport
    const padding = 8;
    if (left < padding) left = padding;
    if (left + tooltipRect.width > window.innerWidth - padding) {
      left = window.innerWidth - tooltipRect.width - padding;
    }
    if (top < padding) top = padding;
    if (top + tooltipRect.height > window.innerHeight - padding) {
      top = window.innerHeight - tooltipRect.height - padding;
    }

    return { top, left };
  }, [position]);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
    setCoords(null);
  };

  // Calculate position after tooltip is rendered
  useEffect(() => {
    if (isVisible && tooltipRef.current) {
      // Use requestAnimationFrame to ensure tooltip is rendered before measuring
      requestAnimationFrame(() => {
        const newCoords = calculatePosition();
        if (newCoords) {
          setCoords(newCoords);
        }
      });
    }
  }, [isVisible, calculatePosition]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-flex"
      >
        {children}
      </div>
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`fixed z-[200] px-2.5 py-1.5 bg-navy-700 border border-navy-500 text-slate-200 text-xs rounded-lg shadow-lg whitespace-nowrap pointer-events-none transition-opacity duration-150 ${
            coords ? 'opacity-100' : 'opacity-0'
          }`}
          style={coords ? { top: coords.top, left: coords.left } : { top: -9999, left: -9999 }}
        >
          {content}
          {/* Arrow */}
          <div
            className={`absolute w-2 h-2 bg-navy-700 border-navy-500 rotate-45 ${
              position === 'bottom'
                ? '-top-1 left-1/2 -translate-x-1/2 border-l border-t'
                : position === 'top'
                ? '-bottom-1 left-1/2 -translate-x-1/2 border-r border-b'
                : position === 'left'
                ? '-right-1 top-1/2 -translate-y-1/2 border-t border-r'
                : '-left-1 top-1/2 -translate-y-1/2 border-b border-l'
            }`}
          />
        </div>
      )}
    </>
  );
}
