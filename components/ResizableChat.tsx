'use client';

import React, { useEffect, useRef, useState } from 'react';
import ChatWidget from './ChatWidget';

export default function ResizableChat() {
  const [height, setHeight] = useState(360);
  const dragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  useEffect(() => {
    setHeight(Math.round(window.innerHeight * 0.38));
  }, []);

  const MIN = 96;
  const getMax = () => Math.round(window.innerHeight * 0.82);

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
    const next = Math.max(MIN, Math.min(startHeight.current + dy, getMax()));
    setHeight(next);
  };

  const endDrag = () => {
    dragging.current = false;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  };

  const collapsed = height <= MIN + 2;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50"
      onMouseMove={(event) => updateDrag(event.clientY)}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      onTouchMove={(event) => updateDrag(event.touches[0].clientY)}
      onTouchEnd={endDrag}
    >
      <div className={`mx-auto w-full max-w-7xl transition-all duration-200 ease-in-out ${collapsed ? '' : 'rounded-t-2xl shadow-lg'}`} style={{ height }}>
        <div
          className="flex h-10 cursor-ns-resize items-center justify-between rounded-t-2xl border-t border-slate-300/70 bg-slate-200/40 px-4 dark:border-white/20 dark:bg-white/10"
          onMouseDown={(event) => beginDrag(event.clientY)}
          onTouchStart={(event) => beginDrag(event.touches[0].clientY)}
          aria-label="Resize chat"
          role="separator"
        >
          <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-500/50" />
        </div>

        {!collapsed ? (
          <div className="h-[calc(100%-40px)] overflow-hidden rounded-t-2xl bg-[var(--background)] text-[var(--foreground)]">
            <div className="h-full p-3 sm:p-4">
              <div className="card h-full rounded-2xl bg-[var(--background)] p-3 sm:p-4">
                <ChatWidget />
              </div>
            </div>
          </div>
        ) : (
          <div className="fixed bottom-0 left-0 right-0 h-8 bg-transparent" onMouseDown={(event) => beginDrag(event.clientY)} onTouchStart={(event) => beginDrag(event.touches[0].clientY)} />
        )}
      </div>
    </div>
  );
}
