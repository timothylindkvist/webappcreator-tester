'use client';

import { createContext, useContext, useRef } from 'react';
import type { RefObject } from 'react';

type CaptureCtxValue = {
  homeRef: RefObject<HTMLDivElement>;
  iframeRef: RefObject<HTMLIFrameElement>;
};

const CaptureContext = createContext<CaptureCtxValue | null>(null);

export function CaptureProvider({ children }: { children: React.ReactNode }) {
  const homeRef = useRef<HTMLDivElement>(null) as RefObject<HTMLDivElement>;
  const iframeRef = useRef<HTMLIFrameElement>(null) as RefObject<HTMLIFrameElement>;
  return (
    <CaptureContext.Provider value={{ homeRef, iframeRef }}>
      {children}
    </CaptureContext.Provider>
  );
}

export function useCapture(): CaptureCtxValue {
  const ctx = useContext(CaptureContext);
  if (!ctx) throw new Error('useCapture must be used within CaptureProvider');
  return ctx;
}
