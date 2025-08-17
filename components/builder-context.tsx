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
  gallery?: { title?: string; images?: { src: string; alt?: string }[] };
  testimonials?: { title?: string; items?: { quote: string; author?: string }[] };
  pricing?: { title?: string; plans?: { name: string; price: string; features: string[] }[] };
  [k: string]: any;
};

type Ctx = {
  brief: string;
  setBrief: (b: string) => void;
  data: SiteData;
  setData: (d: SiteData) => void;
  mergeData: (patch: Partial<SiteData>) => void;
  applyTheme: (theme: Partial<Theme> | { brand: string; accent: string; background: string; foreground: string; vibe?: string }) => void;
  addSection: (section: string, payload?: any) => void;
  removeSection: (section: string) => void;
  patchSection: (section: string, content: any) => void;
  setTypography: (font?: string) => void;
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
    theme: { palette: { brand: '#7C3AED', accent: '#06B6D4', background: '#FFFFFF', foreground: '#0B0F19' } },
    brand: { name: 'Your Brand', tagline: 'Let’s build something great.' },
    hero: { title: 'Describe your site in the chat →', subtitle: 'The assistant will design & edit live.' },
  });

  const mergeData = (patch: Partial<SiteData>) => setData(cur => ({ ...cur, ...patch }));

  const applyTheme: Ctx['applyTheme'] = (themeLike) => {
    const palette = 'palette' in (themeLike as any)
      ? (themeLike as any).palette
      : { brand: (themeLike as any).brand, accent: (themeLike as any).accent, background: (themeLike as any).background, foreground: (themeLike as any).foreground };
    setData(cur => ({
      ...cur,
      theme: {
        vibe: (themeLike as any).vibe ?? cur.theme.vibe,
        typography: cur.theme.typography,
        density: cur.theme.density,
        palette: {
          brand: palette.brand ?? cur.theme.palette.brand,
          accent: palette.accent ?? cur.theme.palette.accent,
          background: palette.background ?? cur.theme.palette.background,
          foreground: palette.foreground ?? cur.theme.palette.foreground,
        },
      },
    }));
  };

  const addSection: Ctx['addSection'] = (section, payload) => setData(cur => ({ ...cur, [section]: payload ?? (cur as any)[section] ?? {} }));
  const removeSection: Ctx['removeSection'] = (section) => setData(cur => { const clone: any = { ...cur }; delete clone[section]; return clone; });
  const patchSection: Ctx['patchSection'] = (section, content) => setData(cur => ({ ...cur, [section]: { ...(cur as any)[section], ...content } }));
  const setTypography: Ctx['setTypography'] = (font) => font && patchSection('theme', { typography: { body: font, headings: font } });
  const setDensity: Ctx['setDensity'] = (density) => patchSection('theme', { density });
  const applyStylePreset: Ctx['applyStylePreset'] = (preset) => {
    if (preset === 'playful') applyTheme({ brand: '#FF66F4', accent: '#4B73FF', background: '#FFFFFF', foreground: '#0B0F19', vibe: 'playful' });
    if (preset === 'editorial') applyTheme({ brand: '#111827', accent: '#6B7280', background: '#FFFFFF', foreground: '#111827', vibe: 'editorial' });
  };
  const fixImages: Ctx['fixImages'] = () => {};
  const redesign: Ctx['redesign'] = (concept) => mergeData({ theme: { ...data.theme, vibe: concept || 'fresh' } as Theme });
  const rebuild: Ctx['rebuild'] = async () => {
    const res = await fetch('/api/build', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brief }) });
    if (!res.ok) throw new Error('Build failed'); const next = await res.json(); setData(next);
  };

  return <Ctx.Provider value={{ brief, setBrief, data, setData, mergeData, applyTheme, addSection, removeSection, patchSection, setTypography, setDensity, applyStylePreset, fixImages, redesign, rebuild }}>{children}</Ctx.Provider>;
};

export const useBuilder = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useBuilder must be used within BuilderProvider');
  return ctx;
}
