'use client';
import React, { createContext, useContext, useState } from 'react';

export type Theme = {
  vibe?: string;
  palette: { brand: string; accent: string; background: string; foreground: string };
  typography?: { body?: string; headings?: string };
  density?: 'compact' | 'cozy' | 'comfortable';
};

export type SiteData = {
  theme: Theme;
  brand: { name: string; tagline: string; industry?: string };
  hero: { title: string; subtitle: string; cta?: { label: string; href?: string } };
  about?: { heading?: string; body?: string };
  features?: { title?: string; items?: { title: string; body: string }[] };
  gallery?: { title?: string; images?: { src: string; caption?: string }[] };
  testimonials?: { title?: string; items?: { quote: string; author?: string }[] };
  pricing?: { title?: string; plans?: { name: string; price?: string; features?: string[]; includes?: string[] }[] };
  faq?: { title?: string; items?: { q: string; a: string }[] };
  cta?: { title?: string; subtitle?: string; button?: { label: string; href?: string } };
};

type Ctx = {
  brief: string;
  setBrief: (b: string) => void;
  data: SiteData;
  setData: (d: SiteData) => void;
  applyTheme: (themeLike: Partial<Theme> | { palette: Theme['palette'] }) => void;
  addSection: (section: keyof SiteData, payload?: any) => void;
  removeSection: (section: keyof SiteData) => void;
  patchSection: (section: keyof SiteData, patch: any) => void;
  setTypography: (fonts: { body?: string; headings?: string }) => void;
  setDensity: (density: 'compact' | 'cozy' | 'comfortable') => void;
  applyStylePreset: (preset: string) => void;
  fixImages: (section?: string) => void;
  redesign: (concept?: string) => void;
  rebuild: () => Promise<void>;
};

const Ctx = createContext<Ctx | null>(null);

export const BuilderProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [brief, setBrief] = useState('');
  const [data, setData] = useState<SiteData>({
    theme: { palette: { brand: '#7C3AED', accent: '#06B6D4', background: '#FFFFFF', foreground: '#0B0F19' }, density: 'cozy' },
    brand: { name: 'Your Brand', tagline: 'Let’s build something great.' },
    hero: { title: 'Describe your site in the chat →', subtitle: 'The assistant will design & edit live.' },
  });

  const mergeData = (patch: Partial<SiteData>) => setData(cur => ({ ...cur, ...patch }));

  const applyTheme: Ctx['applyTheme'] = (themeLike) => {
    const palette = (themeLike as any)?.palette ?? {};
    setData(cur => ({
      ...cur,
      theme: {
        vibe: (themeLike as any).vibe ?? cur.theme.vibe,
        typography: (themeLike as any).typography ?? cur.theme.typography,
        density: (themeLike as any).density ?? cur.theme.density,
        palette: {
          brand: (palette as any).brand ?? cur.theme.palette.brand,
          accent: (palette as any).accent ?? cur.theme.palette.accent,
          background: (palette as any).background ?? cur.theme.palette.background,
          foreground: (palette as any).foreground ?? cur.theme.palette.foreground,
        },
      },
    }));
  };

  const addSection: Ctx['addSection'] = (section, payload) => setData(cur => ({ ...cur, [section]: payload as any }));
  const removeSection: Ctx['removeSection'] = (section) => setData(cur => {
    const next: any = { ...cur }; delete next[section]; return next;
  });
  const patchSection: Ctx['patchSection'] = (section, patch) => setData(cur => ({ ...cur, [section]: { ...(cur as any)[section], ...(patch || {}) } as any }));
  const setTypography: Ctx['setTypography'] = (fonts) => applyTheme({ typography: fonts });
  const setDensity: Ctx['setDensity'] = (density) => applyTheme({ density });
  const applyStylePreset: Ctx['applyStylePreset'] = (preset) => applyTheme({ vibe: preset });

  const fixImages: Ctx['fixImages'] = (section) => {
    setData(cur => {
      const copy: any = structuredClone(cur);
      const sections = section ? [section] : ['gallery','hero','features','testimonials'] as const;
      sections.forEach((secKey: any) => {
        const sec: any = copy[secKey];
        if (!sec) return;
        if (sec.images && Array.isArray(sec.images)) {
          sec.images = sec.images.map((im: any, idx: number) => ({
            src: im?.src || `https://picsum.photos/seed/${secKey}-${idx}/800/600`,
            caption: im?.caption || '',
          }));
        }
      });
      return copy;
    });
  };

  const redesign: Ctx['redesign'] = (concept) => applyTheme({ vibe: concept || 'fresh' });

  const rebuild: Ctx['rebuild'] = async () => {
    // Call the build API to (re)generate a full site from the current brief
    const res = await fetch('/api/build', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief }),
    });
    if (!res.ok) throw new Error('Build failed');
    const next = await res.json();
    setData(next);
  };

  return (
    <Ctx.Provider
      value={{
        brief, setBrief, data, setData,
        applyTheme, addSection, removeSection, patchSection,
        setTypography, setDensity, applyStylePreset,
        fixImages, redesign, rebuild,
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useBuilder = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useBuilder must be used within BuilderProvider');
  return ctx;
};
