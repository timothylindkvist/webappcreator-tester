
'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
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
  applyStylePreset: (preset: 'minimal'|'playful'|'editorial'|'brutalist'|'luxury'|'retro') => void;
  setTypography: (heading: string, body: string) => void;
  setDensity: (density: 'compact'|'cozy'|'comfortable') => void;
  patchSection: (section: string, content: any) => void;
  redesign: (directives: string, keep?: { palette?: boolean; layout?: boolean; copyTone?: boolean }) => void;
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
    try { localStorage.setItem('themeV1', JSON.stringify({ brand: p.brand, accent: p.accent, bg: p.background, fg: p.foreground })); } catch {}
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

  
  const applyStylePreset = useCallback((preset: 'minimal'|'playful'|'editorial'|'brutalist'|'luxury'|'retro') => {
    document.documentElement.setAttribute('data-style', preset);
  }, []);

  const setTypography = useCallback((heading: string, body: string) => {
    const r = document.documentElement;
    r.style.setProperty('--font-heading', heading);
    r.style.setProperty('--font-body', body);
    try { localStorage.setItem('fontsV1', JSON.stringify({ heading, body })); } catch {}
  }, []);

  const setDensity = useCallback((density: 'compact'|'cozy'|'comfortable') => {
    document.documentElement.setAttribute('data-density', density);
  }, []);

  const patchSection = useCallback((section: string, content: any) => {
    setData((prev: any) => prev ? { ...prev, [section]: content } : prev);
  }, []);

  const redesign = useCallback(async (directives: string, keep?: { palette?: boolean; layout?: boolean; copyTone?: boolean }) => {
    setBrief((b) => {
      const keepTxt = keep ? ` Keep:${JSON.stringify(keep)}.` : '';
      return `${b}\n\nDirectives: ${directives}.${keepTxt}`;
    });
    await rebuild();
  }, [rebuild]);

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

  // Boot theme from localStorage before paint (paired with layout boot script)
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('themeV1');
      if (saved) {
        const t = JSON.parse(saved);
        applyTheme({ brand: t.brand, accent: t.accent, background: t.bg, foreground: t.fg });
      }
    } catch {}
  }, [applyTheme]);

  return (
    <Ctx.Provider value={{ brief, setBrief, data, setData, applyTheme, rebuild, addSection, removeSection, fixImages, applyStylePreset, setTypography, setDensity, patchSection, redesign }}>
      {children}
    </Ctx.Provider>
  );
}

export function useBuilder() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useBuilder must be used within BuilderProvider');
  return ctx;
}
