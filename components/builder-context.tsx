'use client';

import { createContext, useContext, useEffect, useMemo, useState, type Dispatch, type PropsWithChildren, type SetStateAction } from 'react';
import { ensureNavScript } from '../lib/navIntercept';

export type Theme = {
  vibe?: string;
  palette: {
    brand: string;
    accent: string;
    background: string;
    foreground: string;
  };
  typography?: { body?: string; headings?: string };
  density?: 'compact' | 'cozy' | 'comfortable';
  background?: {
    style: 'mesh' | 'radial-glow' | 'shapes' | 'energy' | 'gradient-scene';
    palette: string[];
    intensity: 'soft' | 'balanced' | 'vivid';
    blendMode?: 'screen' | 'overlay' | 'lighten' | 'normal';
    particleField?: boolean;
  };
};

export type Block = { id: string; type: string; data?: Record<string, unknown> };
export type Page = { id: string; name: string; html: string };

export type SiteData = {
  theme: Theme;
  brand: { name: string; tagline: string; industry?: string };
  media?: { hero?: { url?: string } };
  hero: {
    title: string;
    subtitle: string;
    cta?: { label: string; href?: string };
    backgroundImage?: string;
    pattern?: string;
    metrics?: { value: string; label: string }[];
  };
  about?: { heading?: string; body?: string; bullets?: string[] };
  features?: {
    title?: string;
    items?: { title: string; body?: string; description?: string }[];
  };
  gallery?: {
    title?: string;
    displayType?: string;
    items?: { title?: string; image?: string; icon?: string; description?: string; stat?: string; subtitle?: string; color?: string; gradient?: string; accentColor?: string; url?: string; [key: string]: unknown }[];
    images?: { src: string; caption?: string; alt?: string }[];
  };
  testimonials?: {
    title?: string;
    items?: { quote: string; author?: string }[];
    quotes?: { quote: string; author: string }[];
  };
  pricing?: {
    title?: string;
    heading?: string;
    plans?: { name: string; price?: string; features?: string[]; includes?: string[] }[];
  };
  faq?: { title?: string; items?: { q: string; a: string }[] };
  cta?: {
    title?: string;
    heading?: string;
    subtitle?: string;
    subheading?: string;
    button?: { label: string; href?: string };
    primary?: { label: string; href?: string };
  };
  game?: Record<string, unknown>;
  history?: { title?: string; body?: string };
  html?: { content?: string } | string;
  blocks?: Block[];
  [key: string]: unknown;
};

type CtxShape = {
  brief: string;
  setBrief: (brief: string) => void;
  data: SiteData;
  setData: Dispatch<SetStateAction<SiteData>>;
  siteId: string | null;
  setSiteId: (id: string | null) => void;
  loadSite: (site: Partial<SiteData>, brief?: string) => void;
  applyTheme: (theme: Partial<Theme> | Record<string, unknown>) => void;
  addSection: (section: string, payload?: unknown) => void;
  removeSection: (section: string) => void;
  patchSection: (section: string, patch: unknown) => void;
  applyOverrides: (overrides: Record<string, string>) => void;
  setTypography: (fonts: { body?: string; headings?: string }) => void;
  setDensity: (density: 'compact' | 'cozy' | 'comfortable') => void;
  applyStylePreset: (preset: string) => void;
  fixImages: (section?: string | 'all') => void;
  redesign: (concept?: string) => void;
  rebuild: (briefOverride?: string) => Promise<void>;
  reset: () => void;
  // Multi-page
  pages: Page[];
  activePage: string;
  addPage: (page: Page) => void;
  updatePage: (id: string, html: string) => void;
  removePage: (id: string) => void;
  setActivePage: (id: string) => void;
};

const BuilderCtx = createContext<CtxShape | null>(null);

const RESERVED_KEYS = new Set(['theme', 'brand', 'media', 'blocks']);
const DEFAULT_BLOCK_ORDER = ['hero', 'about', 'features', 'gallery', 'testimonials', 'pricing', 'faq', 'cta', 'game', 'history', 'html'];

const initialData: SiteData = {
  theme: {
    palette: {
      brand: '#7C3AED',
      accent: '#06B6D4',
      background: '#ffffff',
      foreground: '#0b0f19',
    },
    density: 'cozy',
  },
  brand: { name: '', tagline: '' },
  media: { hero: { url: '' } },
  hero: { title: '', subtitle: '' },
  blocks: [{ id: 'hero', type: 'hero', data: { title: '', subtitle: '' } }],
};

function normalizeTheme(input?: Partial<Theme> | null, fallback?: Theme): Theme {
  const base = fallback ?? initialData.theme;
  const palette = {
    brand: input?.palette?.brand ?? base.palette.brand,
    accent: input?.palette?.accent ?? base.palette.accent,
    background: input?.palette?.background ?? base.palette.background,
    foreground: input?.palette?.foreground ?? base.palette.foreground,
  };

  return {
    ...base,
    ...input,
    palette,
    typography: { ...(base.typography ?? {}), ...(input?.typography ?? {}) },
    density: input?.density ?? base.density,
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function makeBlock(type: string, data: unknown, id?: string): Block {
  return {
    id: id ?? type,
    type,
    data: (data && typeof data === 'object' ? clone(data) : {}) as Record<string, unknown>,
  };
}

function inferBlocks(site: SiteData): Block[] {
  const explicit = Array.isArray(site.blocks) ? site.blocks.filter(Boolean) : [];
  const map = new Map<string, Block>();

  for (const block of explicit) {
    if (!block?.type) continue;
    map.set(block.id || block.type, makeBlock(block.type, block.data ?? (site as Record<string, unknown>)[block.type], block.id || block.type));
  }

  for (const key of DEFAULT_BLOCK_ORDER) {
    const value = (site as Record<string, unknown>)[key];
    if (value == null) continue;
    if (!map.has(key)) map.set(key, makeBlock(key, value, key));
  }

  for (const [key, value] of Object.entries(site)) {
    if (RESERVED_KEYS.has(key) || DEFAULT_BLOCK_ORDER.includes(key)) continue;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (!map.has(key)) map.set(key, makeBlock(key, value, key));
    }
  }

  return Array.from(map.values());
}

function syncRootFromBlocks(site: SiteData): SiteData {
  const next = { ...site } as SiteData;
  const blocks = inferBlocks(next);

  for (const key of Object.keys(next)) {
    if (RESERVED_KEYS.has(key)) continue;
    if (typeof next[key] === 'object') delete next[key];
  }

  for (const block of blocks) {
    next[block.type] = clone(block.data ?? {});
  }
  next.blocks = blocks;
  next.theme = normalizeTheme(next.theme, initialData.theme);
  next.media = { hero: { url: next.media?.hero?.url || next.hero?.backgroundImage || '' } };
  if (next.media.hero?.url) {
    next.hero = { ...next.hero, backgroundImage: next.media.hero.url };
  }
  return next;
}

function mergeSite(cur: SiteData, incoming: Partial<SiteData>): SiteData {
  const out = clone(cur);

  for (const [key, value] of Object.entries(incoming || {})) {
    if (value === undefined) continue;

    if (key === 'theme' && value && typeof value === 'object') {
      out.theme = normalizeTheme(value as Partial<Theme>, out.theme);
      continue;
    }

    if (key === 'blocks' && Array.isArray(value)) {
      out.blocks = value.map((block) => makeBlock(block.type, block.data, block.id));
      continue;
    }

    if (value === null) {
      delete out[key];
      continue;
    }

    if (Array.isArray(value)) {
      out[key] = clone(value);
      continue;
    }

    if (typeof value === 'object') {
      const currentValue = out[key];
      if (currentValue && typeof currentValue === 'object' && !Array.isArray(currentValue)) {
        out[key] = { ...(currentValue as Record<string, unknown>), ...clone(value) };
      } else {
        out[key] = clone(value);
      }
      continue;
    }

    out[key] = value;
  }

  if (incoming.media?.hero?.url !== undefined) {
    out.hero = { ...out.hero, backgroundImage: incoming.media.hero.url || '' };
  }
  if ((incoming.hero as SiteData['hero'] | undefined)?.backgroundImage !== undefined) {
    out.media = { hero: { url: incoming.hero?.backgroundImage || '' } };
  }

  // Sync out.blocks so inferBlocks (which prefers block.data) doesn't revert freshly merged data.
  if (Array.isArray((out as any).blocks)) {
    const changedKeys = new Set<string>();
    for (const [key, value] of Object.entries(incoming || {})) {
      if (key !== 'blocks' && key !== 'theme' && value !== undefined) changedKeys.add(key);
    }
    if ((incoming as Partial<SiteData>)?.media?.hero?.url !== undefined) changedKeys.add('hero');
    if ((incoming as any)?.hero?.backgroundImage !== undefined) changedKeys.add('hero');

    if (changedKeys.size > 0) {
      (out as any).blocks = (out as any).blocks.map((block: Block) => {
        if (!block?.type) return block;
        if (!changedKeys.has(block.type) && !changedKeys.has(block.id ?? '')) return block;
        const freshData = (out as Record<string, unknown>)[block.type];
        if (freshData !== undefined && typeof freshData === 'object' && !Array.isArray(freshData)) {
          return { ...block, data: clone(freshData) };
        }
        return block;
      });
    }
  }

  return syncRootFromBlocks(out as SiteData);
}

function setNestedOverride(obj: Record<string, unknown>, parts: string[], value: string): void {
  let target: any = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = isNaN(Number(parts[i])) ? parts[i] : Number(parts[i]);
    const nextIsIndex = !isNaN(Number(parts[i + 1]));
    if (target[key] == null || typeof target[key] !== 'object') {
      target[key] = nextIsIndex ? [] : {};
    }
    target = target[key];
  }
  const last = parts[parts.length - 1];
  target[isNaN(Number(last)) ? last : Number(last)] = value;
}

// Inject a nav link into an HTML page's <nav><ul> using the browser DOMParser.
function injectNavLink(html: string, page: Pick<Page, 'id' | 'name'>): string {
  if (typeof window === 'undefined') return html;
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const navUl = doc.querySelector('nav ul');
    if (navUl && !navUl.querySelector(`[href="${page.id}.html"]`)) {
      const existingA = navUl.querySelector<HTMLAnchorElement>('li a');
      const li = doc.createElement('li');
      const a = doc.createElement('a');
      a.href = `${page.id}.html`;
      a.textContent = page.name;
      if (existingA) {
        a.className = existingA.className;
        a.style.cssText = existingA.style.cssText;
      }
      li.appendChild(a);
      navUl.appendChild(li);
      return '<!DOCTYPE html>' + doc.documentElement.outerHTML;
    }
  } catch { /* ignore */ }
  return html;
}

export function BuilderProvider({ children }: PropsWithChildren) {
  const [brief, setBrief] = useState('');
  const [data, setData] = useState<SiteData>(initialData);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [activePage, setActivePage] = useState('home');

  const loadSite = (site: Partial<SiteData>, briefText?: string) => {
    setData(cur => syncRootFromBlocks(mergeSite(cur, site)));
    if (briefText !== undefined) setBrief(briefText);
    setPages([]);
    setActivePage('home');
  };

  const applyTheme: CtxShape['applyTheme'] = (themeLike) => {
    const flat = themeLike || {};
    const palette = 'palette' in flat
      ? (flat.palette as Theme['palette'] | undefined)
      : ({
          brand: (flat as Record<string, string>).brand,
          accent: (flat as Record<string, string>).accent,
          background: (flat as Record<string, string>).background,
          foreground: (flat as Record<string, string>).foreground,
        } as Partial<Theme['palette']>);

    setData((cur) => mergeSite(cur, {
      theme: {
        vibe: (flat as Theme).vibe,
        density: (flat as Theme).density,
        typography: (flat as Theme).typography,
        palette: {
          brand: palette?.brand ?? cur.theme.palette.brand,
          accent: palette?.accent ?? cur.theme.palette.accent,
          background: palette?.background ?? cur.theme.palette.background,
          foreground: palette?.foreground ?? cur.theme.palette.foreground,
        },
      },
    }));
  };

  const addSection = (section: string, payload?: unknown) => {
    if (!section) return;
    setData((cur) => mergeSite(cur, { [section]: (payload ?? {}) as never } as Partial<SiteData>));
  };

  const removeSection = (section: string) => {
    setData((cur) => {
      const next = clone(cur);
      delete next[section];
      next.blocks = inferBlocks(next).filter((block) => block.type !== section && block.id !== section);
      return syncRootFromBlocks(next);
    });
  };

  const patchSection = (section: string, patch: unknown) => {
    if (!section) return;
    setData((cur) => {
      const currentSection = (cur as Record<string, unknown>)[section];
      const merged = currentSection && typeof currentSection === 'object'
        ? { ...(currentSection as Record<string, unknown>), ...((patch as Record<string, unknown>) ?? {}) }
        : ((patch as Record<string, unknown>) ?? {});
      return mergeSite(cur, { [section]: merged as never } as Partial<SiteData>);
    });
  };

  const setTypography = (fonts: { body?: string; headings?: string }) => applyTheme({ typography: fonts });
  const setDensity = (density: 'compact' | 'cozy' | 'comfortable') => applyTheme({ density });
  const applyStylePreset = (preset: string) => applyTheme({ vibe: preset });

  const fixImages: CtxShape['fixImages'] = (section = 'all') => {
    setData((cur) => {
      const next = clone(cur);
      const targets = section === 'all' ? ['gallery'] : [section];
      for (const key of targets) {
        const sec = next[key];
        if (!sec || typeof sec !== 'object') continue;
        const imageSection = sec as { images?: NonNullable<SiteData['gallery']>['images'] };
        if (Array.isArray(imageSection.images)) {
          imageSection.images = imageSection.images.map((image, index) => ({
            src: image?.src || `https://loremflickr.com/1200/800/${key}?lock=${index}`,
            caption: image?.caption || '',
            alt: image?.alt || image?.caption || `${key} image ${index + 1}`,
          }));
        }
      }
      return syncRootFromBlocks(next);
    });
  };

  const reset = () => {
    setBrief('');
    setData(initialData);
    setSiteId(null);
    setPages([]);
    setActivePage('home');
  };

  const addPage = (page: Page) => {
    const safeHtml = ensureNavScript(page.html);
    setPages(cur => {
      if (cur.some(p => p.id === page.id)) {
        return cur.map(p => p.id === page.id ? { ...page, html: safeHtml } : p);
      }
      // Update all existing pages' navs to include the new page link
      const updated = cur.map(p => ({ ...p, html: injectNavLink(p.html, page) }));
      return [...updated, { ...page, html: safeHtml }];
    });
    setActivePage(page.id);
  };

  const updatePage = (id: string, html: string) => {
    setPages(cur => cur.map(p => p.id === id ? { ...p, html: ensureNavScript(html) } : p));
  };

  const removePage = (id: string) => {
    setPages(cur => cur.filter(p => p.id !== id));
    setActivePage('home');
  };

  const setSections = ({ blocks = [] as Array<{ id?: string; type: string; data?: unknown }> } = {}) => {
    setData((cur) => mergeSite(cur, { blocks: blocks.map((b) => makeBlock(b.type, b.data, b.id)) }));
  };

  const insertSection = ({ index, type, data: blockData, id }: { index?: number; type: string; data?: unknown; id?: string }) => {
    if (!type) return;
    setData((cur) => {
      const blocks = [...inferBlocks(cur)];
      const targetId = id ?? type;
      const existing = blocks.findIndex((b) => b.id === targetId || b.type === type);
      if (existing !== -1) {
        // Upsert: update the data of the existing block in place instead of duplicating
        blocks[existing] = makeBlock(blocks[existing].type, blockData, blocks[existing].id);
        return mergeSite(cur, { blocks });
      }
      const block = makeBlock(type, blockData, targetId);
      const safeIndex = typeof index === 'number' ? Math.max(0, Math.min(index, blocks.length)) : blocks.length;
      blocks.splice(safeIndex, 0, block);
      return mergeSite(cur, { blocks });
    });
  };

  const updateSection = ({ id, patch }: { id: string; patch?: unknown }) => {
    if (!id) return;
    setData((cur) => {
      const blocks = inferBlocks(cur).map((block) => {
        if (block.id !== id && block.type !== id) return block;
        const merged = block.data && typeof block.data === 'object'
          ? { ...block.data, ...((patch as Record<string, unknown>) ?? {}) }
          : ((patch as Record<string, unknown>) ?? {});
        return { ...block, data: merged };
      });
      return mergeSite(cur, { blocks });
    });
  };

  const moveSection = ({ id, toIndex }: { id: string; toIndex: number }) => {
    if (!id) return;
    setData((cur) => {
      const blocks = [...inferBlocks(cur)];
      const from = blocks.findIndex((block) => block.id === id || block.type === id);
      if (from === -1) return cur;
      const [block] = blocks.splice(from, 1);
      const safeIndex = Math.max(0, Math.min(toIndex, blocks.length));
      blocks.splice(safeIndex, 0, block);
      return mergeSite(cur, { blocks });
    });
  };

  const deleteSection = ({ id }: { id: string }) => {
    if (!id) return;
    removeSection(id);
  };

  const applyOverrides = (overrides: Record<string, string>) => {
    if (!overrides || Object.keys(overrides).length === 0) return;
    setData((cur) => {
      const next = clone(cur) as Record<string, unknown>;
      for (const [path, value] of Object.entries(overrides)) {
        const parts = path.split('.');
        if (parts.length < 2) continue;
        const section = parts[0];
        const sectionData = next[section];
        if (!sectionData || typeof sectionData !== 'object') continue;
        setNestedOverride(sectionData as Record<string, unknown>, parts.slice(1), value);
      }
      return syncRootFromBlocks(next as SiteData);
    });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    (window as Window & { __sidesmithTools?: Record<string, unknown> }).__sidesmithTools = {
      getSiteData: () => data,
      setSiteData: (args: Partial<SiteData>) => setData((cur) => mergeSite(cur, args)),
      updateBrief: (args: { brief?: string }) => setBrief(args?.brief ?? ''),
      applyTheme,
      addSection: (args: { section?: string; payload?: unknown }) => args.section && addSection(args.section, args.payload),
      removeSection: (args: { section?: string }) => args.section && removeSection(args.section),
      patchSection: (args: { section?: string; patch?: unknown }) => args.section && patchSection(args.section, args.patch),
      setSections,
      insertSection,
      updateSection,
      moveSection,
      deleteSection,
      reset,
      addPage: (args: Page) => addPage(args),
      updatePage: (args: { id: string; html: string }) => updatePage(args.id, args.html),
      removePage: (args: { id: string }) => removePage(args.id),
    };
  }, [data, pages]);

  const redesign = () => {};

  const rebuild = async (briefOverride?: string) => {
    const nextBrief = typeof briefOverride === 'string' ? briefOverride : brief;
    const response = await fetch('/api/build', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief: nextBrief }),
    });

    if (!response.ok) {
      throw new Error(`Build failed: ${response.status} ${(await response.text()) || ''}`);
    }

    const json = await response.json();
    if (json?.data) setData(syncRootFromBlocks(json.data as SiteData));
  };

  const value = useMemo<CtxShape>(() => ({
    brief,
    setBrief,
    data,
    setData,
    siteId,
    setSiteId,
    loadSite,
    applyTheme,
    addSection,
    removeSection,
    patchSection,
    applyOverrides,
    setTypography,
    setDensity,
    applyStylePreset,
    fixImages,
    redesign,
    rebuild,
    reset,
    pages,
    activePage,
    addPage,
    updatePage,
    removePage,
    setActivePage,
  }), [brief, data, pages, activePage]);

  return <BuilderCtx.Provider value={value}>{children}</BuilderCtx.Provider>;
}

export function useBuilder() {
  const ctx = useContext(BuilderCtx);
  if (!ctx) throw new Error('useBuilder must be used within BuilderProvider');
  return ctx;
}
