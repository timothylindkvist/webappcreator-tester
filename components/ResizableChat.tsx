'use client';
import React, { useEffect, useRef, useState } from 'react';
import ChatWidget from './ChatWidget';

/**
 * Clean rebuilt version of the resizable chat drawer.
 * - Opens by default (40vh)
 * - Can be dragged vertically (min 40px, max 80vh)
 * - Visible handle strip for easy grab
 * - Smooth transitions and rounded top corners
 */
export default function ResizableChat() {
  const [height, setHeight] = useState(300);
  const dragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  useEffect(() => {
    const defaultH = Math.round(window.innerHeight * 0.4);
    setHeight(defaultH);
  }, []);

  const MIN = 40;
  const getMax = () => Math.round(window.innerHeight * 0.8);

  const beginDrag = (clientY: number) => {
    dragging.current = true;
    startY.current = clientY;
    startHeight.current = height;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ns-resize';
  };

  const updateDrag = (clientY: number) => {
    if (!dragging.current) return;
    const dy = startY.current - clientY;
    let next = startHeight.current + dy;
    if (next < MIN) next = MIN;
    const MAX = getMax();
    if (next > MAX) next = MAX;
    setHeight(next);
  };

  const endDrag = () => {
    dragging.current = false;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  };

  const collapsed = height <= MIN + 0.5;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50"
      onMouseMove={(e) => updateDrag(e.clientY)}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      onTouchMove={(e) => updateDrag(e.touches[0].clientY)}
      onTouchEnd={endDrag}
    >
      <div
        className={`mx-auto w-full max-w-7xl transition-all duration-200 ease-in-out ${
          collapsed ? '' : 'shadow-lg rounded-t-2xl'
        }`}
        style={{ height }}
      >
        {/* Drag handle */}
        <div
          className="w-full border-t border-slate-300/70 dark:border-white/20 h-4 cursor-ns-resize transition-colors bg-slate-200/40 hover:bg-slate-300/60 dark:bg-white/10 rounded-t-md"
          onMouseDown={(e) => beginDrag(e.clientY)}
          onTouchStart={(e) => beginDrag(e.touches[0].clientY)}
          aria-label="Resize chat"
          role="separator"
        />

        {/* Chat content */}
        {!collapsed && (
          <div className="bg-[var(--background)] text-[var(--foreground)] h-[calc(100%-16px)] rounded-t-2xl overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="flex-1 min-h-0 overflow-auto p-3 sm:p-4">
                <div className="card bg-[var(--background)]">
                  <ChatWidget />
                </div>
              </div>
            </div>
          </div>
        )}
      
      {/* Always-present bottom grab zone for easy pulling up when collapsed */}
      {collapsed && (
        <div
          className="fixed bottom-0 left-0 right-0 h-6 cursor-ns-resize bg-transparent z-[60]"
          onMouseDown={(e) => beginDrag(e.clientY)}
          onTouchStart={(e) => beginDrag(e.touches[0].clientY)}
          aria-label="Resize chat (collapsed grab area)"
        />
      )}
</div>
    </div>
  );
}
