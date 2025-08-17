
'use client';

import React from 'react';

import { createContext, useContext, useState, useCallback } from 'react';
import { Schema } from './Builder';

type Data = any; // z.infer<typeof Schema>

type CtxType = {
  brief: string;
  setBrief: (b: string) => void;
  data: Data | null;
  setData: (d: Data | null) => void;
  applyTheme: (p: {brand:string;accent:string;background:string;foreground:string}) => void;
  rebuild: () => Promise<void>;
  addSection: (section: string, payload: any) => void;
  removeSection: (section: string) => void;
  fixImages: (seed: string) => void;
};

const Ctx = createContext<CtxType | null>(null);

export function BuilderProvider({ children }: { children: React.ReactNode }) {
  const [brief, setBrief] = useState<string>('');
  const [data, setData] = useState<Data | null>(null);

  const applyTheme = useCallback((p: {brand:string;accent:string;background:string;foreground:string}) => {
    const r = document.documentElement;
    r.style.setProperty('--brand', p.brand);
    r.style.setProperty('--accent', p.accent);
    r.style.setProperty('--bg', p.background);
    r.style.setProperty('--fg', p.foreground);
  }, []);

  const rebuild = useCallback(async () => {
    const res = await fetch('/api/build', { method: 'POST', body: JSON.stringify({ brief }) });
    const json = await res.json();
    const parsed = Schema.safeParse(json);
    if (parsed.success) setData(parsed.data);
    else throw new Error(parsed.error.message);
  }, [brief]);

  const addSection = useCallback((section: string, payload: any) => {
    setData((prev: any) => prev ? { ...prev, [section]: payload } : prev);
  }, []);

  const removeSection = useCallback((section: string) => {
    setData((prev: any) => {
      if (!prev) return prev;
      const copy = { ...prev };
      delete (copy as any)[section];
      return copy;
    });
  }, []);

  
  // Initialize theme from localStorage or via chat tool on first mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('themeV1');
      if (saved) return; // boot script already applied
    } catch {}
    // Ask chat API for a neutral, tasteful theme; expect a setTheme tool
    (async function(){
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'Initialize theme with a tasteful neutral palette. Only return a setTheme tool instruction; no assistant text.' }],
            state: {}
          })
        });
        const data = await res.json();
        if (Array.isArray(data.tools)) {
          for (const t of data.tools) {
            if (t.type === 'setTheme' && t.palette) {
              applyTheme(t.palette);
              try {
                localStorage.setItem('themeV1', JSON.stringify({
                  brand: t.palette.brand,
                  accent: t.palette.accent,
                  bg: t.palette.background,
                  fg: t.palette.foreground,
                }));
              } catch {}
            }
          }
        }
      } catch(e) {
        // ignore init failure; fallbacks remain
      }
    })();
  }, [applyTheme]);

  const fixImages = useCallback((seed: string) => {
    setData((prev: any) => {
      if (!prev || !prev.gallery?.items) return prev;
      const items = prev.gallery.items.map((it: any, i: number) => ({
        ...it,
        image: it.image && it.image.startsWith('http')
          ? it.image
          : `https://picsum.photos/seed/${seed}-${i}/800/600`
      }));
      return { ...prev, gallery: { ...prev.gallery, items } };
    });
  }, []);

  return (
    <Ctx.Provider value={{ brief, setBrief, data, setData, applyTheme, rebuild, addSection, removeSection, fixImages }}>
      {children}
    </Ctx.Provider>
  );
}

export function useBuilder() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useBuilder must be used within BuilderProvider');
  return ctx;
}
