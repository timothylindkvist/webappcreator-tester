'use client';
import React, { createContext, useContext, useState } from 'react';

export type Theme = {
  vibe?: string;
  palette: { brand: string; accent: string; background: string; foreground: string };
  typography?: { body?: string; headings?: string };
  density?: 'compact' | 'cozy' | 'comfortable';
  background?: { style: 'mesh' | 'radial-glow' | 'shapes' | 'energy' | 'gradient-scene'; palette: string[]; intensity: 'soft' | 'balanced' | 'vivid'; blendMode?: 'screen' | 'overlay' | 'lighten' | 'normal'; particleField?: boolean };
};

export type Block = { id: string; type: string; data?: any };
export type SiteData = {
  media?: { hero?: { url: string } };
  theme: Theme;
  brand: { name: string; tagline: string; industry?: string
  heroImage?: { prompt: string; style?: 'photo' | 'illustration' | '3d' | 'cinematic'; mood?: string; overlay?: boolean } 
  [key: string]: any;
};
  hero: { title: string; subtitle: string; cta?: { label: string; href?: string } };
  about?: { heading?: string; body?: string };
  features?: { title?: string; items?: { title: string; body: string }[] };
  gallery?: { title?: string; images?: { src: string; caption?: string; alt?: string }[] };
  testimonials?: { title?: string; items?: { quote: string; author?: string }[] };
  pricing?: { title?: string; plans?: { name: string; price?: string; features?: string[] }[] };
  faq?: { title?: string; items?: { q: string; a: string }[] };
  cta?: { title?: string; subtitle?: string; button?: { label: string; href?: string } };

  game?: any;
  history?: { title?: string; body?: string };
  html?: { content?: string } | string;
};

export type CtxShape = {
  brief: string;
  setBrief: (b: string) => void;
  data: SiteData;
  setData: (d: SiteData) => void;
  applyTheme: (t: Partial<Theme> | { brand?: string; accent?: string; background?: string; foreground?: string }) => void;
  addSection: (section: keyof SiteData, payload?: any) => void;
  removeSection: (section: keyof SiteData) => void;
  patchSection: (section: keyof SiteData, patch: any) => void;
  setTypography: (fonts: { body?: string; headings?: string }) => void;
  setDensity: (density: 'compact' | 'cozy' | 'comfortable') => void;
  applyStylePreset: (preset: string) => void;
  fixImages: (section?: keyof SiteData | 'all') => void;
  redesign: (concept?: string) => void;
  rebuild: (briefOverride?: string) => Promise<void>;
  reset: () => void;
};

const BuilderCtx = createContext<CtxShape | null>(null);

const initialData: SiteData = {
  theme: {
    palette: { brand: '#7C3AED', accent: '#06B6D4', background: '#ffffff', foreground: '#0b0f19' },
    density: 'cozy',
  },
  brand: { name: 'Your Brand', tagline: 'Let’s build something great.' },
  hero: { title: 'Describe your site in the chat →', subtitle: 'The assistant will design & edit live.' },
};

export const BuilderProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [brief, setBrief] = useState('');
  const [data, setData] = useState<SiteData>(initialData);

  // Merge helper: shallow merge with special-cased theme.palette
  function safeMerge(cur: SiteData, incoming: Partial<SiteData>): SiteData {
    const out: any = { ...cur };
    for (const [k, v] of Object.entries(incoming || {})) {
      if (k === 'theme' && v && typeof v === 'object') {
        const curTheme: any = cur.theme || {};
        const vTheme: any = v;
        out.theme = {
          ...curTheme,
          ...vTheme,
          palette: { ...(curTheme.palette || {}), ...((vTheme || {}).palette || {}) },
        };
      } else if (v === null) {
        delete out[k as keyof SiteData];
  const SINGLETON_KEYS = new Set(['theme','brand','hero','pricing','faq','cta']);
      } else {
        out[k as keyof SiteData] = v as any;
      }
    }
    return out as SiteData;
  }

  const KNOWN_KEYS = new Set(['theme','brand','hero','about','features','gallery','testimonials','pricing','faq','cta','game','history','html']);
// Keys that should be singletons (overwritten rather than duplicated)
const SINGLETON_KEYS = new Set(['theme','brand','hero','pricing','faq','cta']);
  function ensureUnique(baseKey: string, obj: Record<string, any>) {
    let key = baseKey;
    let i = 2;
    while (Object.prototype.hasOwnProperty.call(obj, key)) {
      key = `${baseKey}${i++}`;
    }
    return key;
  }


  const applyTheme: CtxShape['applyTheme'] = (themeLike) => {
    const flat: any = themeLike || {};
    const incomingPalette =
      'palette' in flat
        ? flat.palette
        : (flat.brand || flat.accent || flat.background || flat.foreground)
        ? { brand: flat.brand, accent: flat.accent, background: flat.background, foreground: flat.foreground }
        : undefined;

    setData((cur) => ({
      ...cur,
      theme: {
        vibe: flat.vibe ?? cur.theme.vibe,
        typography: flat.typography ?? cur.theme.typography,
        density: flat.density ?? cur.theme.density,
        palette: {
          brand: incomingPalette?.brand ?? cur.theme.palette.brand,
          accent: incomingPalette?.accent ?? cur.theme.palette.accent,
          background: incomingPalette?.background ?? cur.theme.palette.background,
          foreground: incomingPalette?.foreground ?? cur.theme.palette.foreground,
        },
      },
    }));
  };

  const addSection: CtxShape['addSection'] = (section, payload) => setData((cur) => {
    const next: any = { ...cur };
    const key = String(section);
    if (next[key] && !SINGLETON_KEYS.has(key)) {
      const unique = ensureUnique(key, next);
      next[unique] = payload as any;
    } else {
      next[key] = payload as any;
    }
    return next;
  });

  const removeSection: CtxShape['removeSection'] = (section) =>
    setData((cur) => {
      const next: any = { ...cur };
      delete next[section];
      return next;
    });

  const patchSection: CtxShape['patchSection'] = (section, patch) =>
    setData((cur) => ({ ...cur, [section]: { ...(cur as any)[section], ...(patch || {}) } as any }));

  const setTypography: CtxShape['setTypography'] = (fonts) => applyTheme({ typography: fonts });
  const setDensity: CtxShape['setDensity'] = (density) => applyTheme({ density });
  const applyStylePreset: CtxShape['applyStylePreset'] = (preset) => applyTheme({ vibe: preset });

  const fixImages: CtxShape['fixImages'] = (which = 'all') => {
    setData((cur) => {
      const copy: any = structuredClone(cur);
      const keys: (keyof SiteData)[] =
        which === 'all' ? (['gallery', 'hero', 'features', 'testimonials'] as any) : [which];
      keys.forEach((k) => {
        const sec: any = copy[k];
        if (!sec) return;
        if (Array.isArray(sec.images)) {
          sec.images = sec.images.map((im: any, idx: number) => ({
            src: im?.src || `https://picsum.photos/seed/${String(k)}-${idx}/800/600`,
            caption: im?.caption || '',
            alt: im?.alt || im?.caption || `${String(k)} image ${idx + 1}`,
          }));
        }
      });
      return copy;
    });
  };

  const reset: CtxShape['reset'] = () => {
    setBrief('');
    setData(initialData);
  };

  // Ordered-sections API handlers
  const setSections = ({ blocks = [] as Array<{ id?: string; type: string; data?: any }> } = {}) => {
    setData((cur) => {
      const next: any = { ...cur };
      for (const b of blocks) {
        if (!b?.type) continue;
        next[b.type] = b.data ?? {};
      }
      return next;
    });
  };
  const insertSection = ({ type, data }: { type: string; data?: any }) => {
    setData((cur) => ({ ...(cur as any), [type]: data ?? {} }));
  };
  const updateSection = ({ id, patch }: { id: string; patch?: any }) => {
    setData((cur) => ({ ...(cur as any), [id]: { ...(cur as any)[id], ...(patch ?? {}) } }));
  };
  const moveSection = (_: { id: string; toIndex: number }) => {};
  const deleteSection = ({ id }: { id: string }) => {
    setData((cur) => {
      const next: any = { ...cur };
      if (next[id]) {
        delete next[id];
        return next;
      }
      const target = Object.keys(next).find((k) => {
        const v: any = (next as any)[k];
        const t = (v?.title || v?.heading || '').toLowerCase();
        return t.includes(id.toLowerCase());
      });
      if (target) delete next[target];
      return next;
    });
  };

  // Expose handlers for chat tool calls
  if (typeof window !== 'undefined') {
    (window as any).__sidesmithTools = {
      setSiteData: (args: any) => setData((cur) => safeMerge(cur, args)),
      updateBrief: (args: any) => setBrief(args?.brief ?? ''),
      applyTheme: (args: any) => applyTheme(args),
      addSection: (args: any) => addSection(args?.section as any, args?.payload),
      removeSection: (args: any) => removeSection(args?.section as any),
      patchSection: (args: any) => patchSection(args?.section as any, args?.patch),
      setSections,
      insertSection,
      updateSection,
      moveSection,
      deleteSection,
      reset,
    };
  }

  const redesign: CtxShape['redesign'] = () => {
    // placeholder for future AI actions
  };

  const rebuild: CtxShape['rebuild'] = async (briefOverride?: string) => {
    const _brief = typeof briefOverride === 'string' ? briefOverride : brief;
    const res = await fetch('/api/build', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief: _brief }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Build failed: ${res.status} ${errText}`);
    }
    const json = await res.json();
    if (json?.data) setData(json.data as SiteData);
  };

  return (
    <BuilderCtx.Provider
      value={{
        brief,
        setBrief,
        data,
        setData,
        applyTheme,
        addSection,
        removeSection,
        patchSection,
        setTypography,
        setDensity,
        applyStylePreset,
        fixImages,
        redesign,
        rebuild,
        reset, // ✅ now exposed in the context value
      }}
    >
      {children}
    </BuilderCtx.Provider>
  );
};

export const useBuilder = () => {
  const ctx = useContext(BuilderCtx);
  if (!ctx) throw new Error('useBuilder must be used within BuilderProvider');
  return ctx;
};
