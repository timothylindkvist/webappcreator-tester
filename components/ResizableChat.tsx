'use client';
import React, { useEffect, useRef, useState } from 'react';
import ChatWidget from './ChatWidget';

/**
 * A bottom-anchored, vertically resizable chat drawer.
 * - Opens by default ~40% of viewport height.
 * - Drag the top edge (no visible handle bar; only a thin top border line remains when collapsed).
 * - Collapses to a minimal 40px height where only the drag zone / border is visible.
 * - Expands up to 80vh.
 * - Works with mouse and touch.
 */
export default function ResizableChat() {
  // Default height ~40% of viewport on mount; keep SSR safe.
  const [height, setHeight] = useState<number>(300); // placeholder before mount
  const draggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  useEffect(() => {
    // Initialize default open height at 40vh
    const h = Math.round(window.innerHeight * 0.4);
    setHeight(h);
  }, []);

  // Limits
  const MIN = 40; // collapsed state (only thin line visible)
  const MAX = Math.round(typeof window !== 'undefined' ? window.innerHeight * 0.8 : 800);

  // Start drag
  const onDragStart = (clientY: number) => {
    draggingRef.current = true;
    startYRef.current = clientY;
    startHeightRef.current = height;
    // Prevent text selection while dragging
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ns-resize';
  };

  // During drag
  const onDragMove = (clientY: number) => {
    if (!draggingRef.current) return;
    const dy = startYRef.current - clientY; // dragging up increases height
    let next = startHeightRef.current + dy;
    if (next < MIN) next = MIN;
    if (next > MAX) next = MAX;
    setHeight(next);
  };

  // End drag
  const onDragEnd = () => {
    draggingRef.current = false;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  };

  // Mouse handlers
  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => onDragStart(e.clientY);
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => onDragMove(e.clientY);
  const onMouseUp = () => onDragEnd();
  const onMouseLeave = () => { if (draggingRef.current) onDragEnd(); };

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => onDragStart(e.touches[0].clientY);
  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => onDragMove(e.touches[0].clientY);
  const onTouchEnd = () => onDragEnd();

  // When collapsed, only show the thin line (border) at the top edge.
  const collapsed = height <= MIN + 0.5;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50"
      // Capture global mouse/touch move while cursor is over the component
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Outer wrapper sets the height. Rounded top + shadow when open. */}
      <div
        className={[
          'mx-auto w-full max-w-7xl',
          'transition-all duration-200 ease-in-out',
          collapsed ? '' : 'shadow-lg rounded-t-2xl'
        ].join(' ')}
        style={{ height }}
      >
        {/* Drag zone at the very top: invisible but interactive.
            We keep a thin border line to hint the drag affordance.
        */}
        <div
          className={[
            'w-full border-t',
            'border-slate-300/70 dark:border-white/20',
            // Give the drag zone a practical hit area without rendering a bar
            'h-6 -mt-3 cursor-ns-resize relative', 'before:absolute before:inset-x-0 before:top-0 before:h-6 before:bg-transparent'
          ].join(' ')}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          // aria-label helps accessibility
          aria-label="Resize chat"
          role="separator"
        />

        {/* Content area: hidden when collapsed */}
        {!collapsed && (
          <div className="bg-[var(--background)] text-[var(--foreground)] h-[calc(100%-12px)] rounded-t-2xl overflow-hidden">
            {/* Ensure the inner chat stretches and scrolls nicely */}
            <div className="h-full flex flex-col">
              <div className="flex-1 min-h-0 overflow-auto p-3 sm:p-4">
                {/* The existing chat widget lives here */}
                <div className="card bg-[var(--background)]">
                  <ChatWidget />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
