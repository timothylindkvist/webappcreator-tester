'use client';

import type { CSSProperties } from 'react';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BuilderProvider, useBuilder } from '../components/builder-context';
import { EditModeProvider, useEditMode } from '../components/EditModeContext';
import Builder from '../components/Builder';
import ChatWidget from '../components/ChatWidget';
import { CaptureProvider, useCapture } from '../components/capture-context';
import { NAV_INTERCEPT_SCRIPT } from '../lib/navIntercept';
import { buildEditorScript, teardownEditorScript } from '../lib/inlineEditor';

function SiteLoader() {
  const { loadSite, setSiteId } = useBuilder();
  const params = useSearchParams();

  useEffect(() => {
    const id = params.get('site');
    if (!id) return;
    fetch(`/api/builder/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.ok && json.site) {
          loadSite(json.site, json.brief ?? '');
          setSiteId(id);
        }
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

function isLightBackground(hex: string): boolean {
  const h = hex.replace('#', '');
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.5;
}

function deriveSiteVars(palette: {
  brand: string;
  accent: string;
  background: string;
  foreground: string;
}): CSSProperties {
  const light = isLightBackground(palette.background);
  return {
    '--brand': palette.brand,
    '--accent': palette.accent,
    '--background': palette.background,
    '--foreground': palette.foreground,
    '--card': light ? '#f4f4f5' : '#18181b',
    '--card-foreground': palette.foreground,
    '--border': light ? '#e4e4e7' : '#27272a',
    '--muted': light ? '#71717a' : '#a1a1aa',
    '--muted-foreground': light ? '#a1a1aa' : '#71717a',
    '--input': light ? '#e4e4e7' : '#27272a',
    '--primary': palette.brand,
    '--primary-foreground': '#ffffff',
  } as CSSProperties;
}

function TopBar() {
  const { data } = useBuilder();
  const siteName = data.hero?.title ? data.brand?.name || '' : '';

  return (
    <header className="h-[52px] flex-shrink-0 flex items-center px-5 gap-4 bg-[#08080d] border-b border-white/[0.06]">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center shadow-lg">
          <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
        </div>
        <span className="font-semibold text-white text-[13px] tracking-tight">appcreator</span>
      </div>

      {siteName && (
        <>
          <div className="h-4 w-px bg-white/[0.08]" />
          <span className="text-[12px] text-white/30 truncate max-w-[200px]">{siteName}</span>
        </>
      )}
    </header>
  );
}

function BrowserBar({ label }: { label: string }) {
  return (
    <div className="h-10 flex-shrink-0 flex items-center gap-3 px-4 bg-[#0f0f16] border-b border-white/[0.05]">
      <div className="flex gap-1.5">
        <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
        <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
        <div className="w-3 h-3 rounded-full bg-[#28C840]" />
      </div>
      <div className="flex-1 flex justify-center">
        <div className="bg-white/[0.04] rounded-md px-4 py-1 text-[11px] text-white/25 min-w-[180px] max-w-[320px] text-center truncate">
          {label}
        </div>
      </div>
      <div className="w-[60px]" />
    </div>
  );
}

function EmptyPreview() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center select-none px-8">
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-2xl bg-[#8B5CF6] blur-xl opacity-20" />
        <div className="relative w-14 h-14 rounded-2xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 flex items-center justify-center">
          <svg className="w-6 h-6 text-[#8B5CF6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253M3.284 14.253A8.959 8.959 0 013 12c0-1.636.437-3.17 1.202-4.5" />
          </svg>
        </div>
      </div>
      <p className="text-[13px] font-medium text-white/40 mb-1.5">Your site will appear here</p>
      <p className="text-[11px] text-white/20 max-w-[180px] leading-relaxed">
        Describe it in the chat and I'll generate a live preview
      </p>
    </div>
  );
}

// ── Page navigation helpers ───────────────────────────────────────────────────

type Page = import('../components/builder-context').Page;

function hrefToPageId(href: string, pages: Page[]): string | null {
  // Strip leading ./ or / before comparing
  const clean = href.replace(/^\.?\/+/, '').split('?')[0].split('#')[0].toLowerCase().trim();
  if (clean === '' || clean === 'index.html') return 'home';
  const base = clean.replace(/\.html$/, '');
  if (base === 'home') return 'home';
  const match = pages.find((p) => p.id.toLowerCase() === base || p.name.toLowerCase() === base);
  return match?.id ?? null;
}


// generateEditScript and FloatingEditToolbar replaced by shared lib/inlineEditor.ts

// ── Page tab bar ──────────────────────────────────────────────────────────────

const PAGE_SUGGESTIONS = ['Team', 'About', 'Contact', 'Services', 'Portfolio', 'Pricing'];

function PageTabBar() {
  const { data, brief, pages, activePage, setActivePage, addPage } = useBuilder();
  const [menuOpen, setMenuOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hasContent = !!(data.hero?.title);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const openMenu = () => {
    if (addBtnRef.current) {
      const rect = addBtnRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left });
    }
    setMenuOpen((o) => !o);
  };

  const handleAddPage = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || busy || !hasContent) return;
    setBusy(true);
    setMenuOpen(false);
    setCustomInput('');
    try {
      const res = await fetch('/api/page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageName: trimmed,
          brief,
          designSystem: {
            colors: data.theme.palette,
            brandName: data.brand.name,
          },
          existingPages: [
            { id: 'home', name: 'Home' },
            ...pages.map((p) => ({ id: p.id, name: p.name })),
          ],
        }),
      });
      const json = await res.json();
      if (json.ok && json.html) {
        addPage({ id: json.pageId, name: json.pageName, html: json.html });
      }
    } catch { /* ignore */ } finally {
      setBusy(false);
    }
  };

  if (!hasContent) return null;

  return (
    <div className="flex-shrink-0 flex items-center h-8 bg-[#0c0c14] border-b border-white/[0.05]">
      <button
        onClick={() => setActivePage('home')}
        className={`h-full px-4 text-[11px] font-medium border-b-2 transition-colors whitespace-nowrap ${
          activePage === 'home'
            ? 'text-white border-[#7c3aed]'
            : 'text-white/35 border-transparent hover:text-white/60'
        }`}
      >
        Home
      </button>

      {pages.map((page) => (
        <button
          key={page.id}
          onClick={() => setActivePage(page.id)}
          className={`h-full px-4 text-[11px] font-medium border-b-2 transition-colors whitespace-nowrap ${
            activePage === page.id
              ? 'text-white border-[#7c3aed]'
              : 'text-white/35 border-transparent hover:text-white/60'
          }`}
        >
          {page.name}
        </button>
      ))}

      {/* Add page button — ref tracked for fixed dropdown positioning */}
      <button
        ref={addBtnRef}
        onClick={openMenu}
        disabled={busy}
        title="Add a page"
        className="ml-1 h-5 w-5 flex items-center justify-center rounded text-white/25 hover:text-white/60 hover:bg-white/5 text-[16px] leading-none disabled:opacity-40 transition-colors"
      >
        {busy ? (
          <span className="text-[10px] animate-pulse">…</span>
        ) : (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" d="M6 1v10M1 6h10" />
          </svg>
        )}
      </button>

      {/* Dropdown — fixed position with z-index 99999 so it's always on top */}
      {menuOpen && (
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, zIndex: 99999 }}
          className="bg-[#17172a] border border-white/[0.1] rounded-xl shadow-2xl p-3 min-w-[210px]"
        >
          <p className="text-[10px] text-white/35 font-semibold uppercase tracking-wider mb-2">Add a page</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {PAGE_SUGGESTIONS.map((name) => (
              <button
                key={name}
                onClick={() => handleAddPage(name)}
                className="px-2.5 py-1 rounded-lg text-[11px] bg-white/[0.04] text-white/55 hover:bg-[#7c3aed]/20 hover:text-white border border-white/[0.07] transition-colors"
              >
                {name}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <input
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddPage(customInput);
                if (e.key === 'Escape') setMenuOpen(false);
              }}
              placeholder="Custom page name…"
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[11px] text-white/70 placeholder-white/20 outline-none focus:border-[#7c3aed]/40"
            />
            <button
              onClick={() => handleAddPage(customInput)}
              disabled={!customInput.trim()}
              className="px-2.5 py-1.5 bg-[#7c3aed] hover:bg-[#6d28d9] rounded-lg text-[11px] text-white font-medium disabled:opacity-40 transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Home page nav (mirrors _smInjectNav on custom pages) ─────────────────────

function HomePageNav({
  pages,
  activePage,
  setActivePage,
  palette,
}: {
  pages: Page[];
  activePage: string;
  setActivePage: (id: string) => void;
  palette: { brand: string; accent: string; background: string; foreground: string };
}) {
  if (pages.length === 0) return null;
  const light = isLightBackground(palette.background);
  const border = light ? '#e4e4e7' : '#27272a';
  const muted = light ? '#71717a' : '#a1a1aa';
  const allPages = [{ id: 'home', name: 'Home' }, ...pages];
  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 999,
        background: palette.background,
        borderBottom: `1px solid ${border}`,
        padding: '0 1.25rem',
        display: 'flex',
        alignItems: 'center',
        height: '3.5rem',
        gap: '1.5rem',
        fontFamily: 'inherit',
        flexShrink: 0,
      }}
    >
      {allPages.map((p) => {
        const active = p.id === activePage;
        return (
          <a
            key={p.id}
            href="#"
            onClick={(e) => { e.preventDefault(); setActivePage(p.id); }}
            style={{
              textDecoration: 'none',
              fontSize: '.875rem',
              color: active ? palette.brand : muted,
              fontWeight: active ? 600 : 400,
              cursor: 'pointer',
            }}
          >
            {p.name}
          </a>
        );
      })}
    </nav>
  );
}

// ── Iframe nav builder (shared by onLoad and the pages-change useEffect) ─────

function injectIframeNav(
  doc: Document,
  pages: Page[],
  activePage: string,
  palette: { brand: string; accent: string; background: string; foreground: string },
  setActivePage: (id: string) => void
) {
  doc.getElementById('sm-nav')?.remove();
  const light = isLightBackground(palette.background);
  const bg = palette.background;
  const brand = palette.brand;
  const muted = light ? '#71717a' : '#a1a1aa';
  const border = light ? '#e4e4e7' : '#27272a';
  const nav = doc.createElement('nav');
  nav.id = 'sm-nav';
  nav.setAttribute('style', `position:sticky;top:0;z-index:999;background:${bg};border-bottom:1px solid ${border};padding:0 1.25rem;display:flex;align-items:center;height:3.5rem;gap:1.5rem;font-family:inherit;`);
  [{ id: 'home', name: 'Home' }, ...pages].forEach((p) => {
    const a = doc.createElement('a');
    a.href = '#';
    a.textContent = p.name;
    const isActive = p.id === activePage;
    a.setAttribute('style', `text-decoration:none;font-size:.875rem;color:${isActive ? brand : muted};font-weight:${isActive ? '600' : '400'};cursor:pointer;`);
    a.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      setActivePage(p.id);
    });
    nav.appendChild(a);
  });
  const body = doc.body;
  if (body.firstChild) body.insertBefore(nav, body.firstChild);
  else body.appendChild(nav);
}

// ── Preview pane ──────────────────────────────────────────────────────────────

function PreviewPane() {
  const { data, pages, activePage, updatePage, setActivePage } = useBuilder();
  const { isEditMode, hasChanges, saveChanges } = useEditMode();
  const hasContent = !!(data.hero?.title);
  const domain = hasContent
    ? `${(data.brand?.name || 'yoursite').toLowerCase().replace(/\s+/g, '-')}.com`
    : 'yoursite.com';

  const activePageData = activePage !== 'home' ? pages.find((p) => p.id === activePage) : null;
  const urlLabel = activePageData ? `${domain}/${activePageData.id}.html` : domain;
  const siteVars = deriveSiteVars(data.theme.palette);

  const { homeRef: homeContentRef, iframeRef } = useCapture();

  // Inject / remove shared inline editor on home page
  useEffect(() => {
    if (activePage !== 'home') return;
    const container = homeContentRef.current;
    if (!isEditMode) {
      if ((window as any).__smEditorActive) teardownEditorScript(window);
      return;
    }
    if (!container) return;
    // Teardown any prior instance before re-injecting (e.g. palette changed)
    if ((window as any).__smEditorActive) teardownEditorScript(window);
    (window as any).__smRoot = container;
    const script = document.createElement('script');
    script.textContent = buildEditorScript(data.theme.palette);
    document.body.appendChild(script);
    return () => { teardownEditorScript(window); };
  }, [isEditMode, activePage, data.theme.palette]);

  // Re-mark elements added dynamically (e.g. Claude updates home page content)
  useEffect(() => {
    if (activePage !== 'home' || !isEditMode) return;
    const container = homeContentRef.current;
    if (!container) return;
    const SELECTORS = 'h1,h2,h3,h4,h5,h6,p,span,li,button,a,td,th,label';
    container.querySelectorAll<HTMLElement>(SELECTORS).forEach((el) => {
      el.contentEditable = 'true';
      el.dataset.editable = 'true';
    });
  }, [isEditMode, activePage, data]);

  // Inject / remove edit mode in iframe pages
  useEffect(() => {
    if (!activePageData) return;
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doInject = () => {
      const iwin = iframe.contentWindow as any;
      const doc = iframe.contentDocument;
      if (!doc) return;

      if (isEditMode && !iwin?.__smEditorActive) {
        const script = doc.createElement('script');
        script.textContent = buildEditorScript(data.theme.palette);
        doc.body.appendChild(script);
      } else if (!isEditMode && iwin?.__smEditorActive) {
        teardownEditorScript(iwin as Window);
      }
    };

    if (iframe.contentDocument?.readyState === 'complete') {
      doInject();
    } else {
      iframe.addEventListener('load', doInject, { once: true });
      return () => iframe.removeEventListener('load', doInject);
    }
  }, [isEditMode, activePageData?.id, data.theme.palette]);

  // Re-inject nav when pages/activePage change while the iframe is already loaded
  // (handles "new page added without reloading the iframe" case).
  // Initial injection on page load is handled by the onLoad callback below.
  useEffect(() => {
    if (!activePageData) return;
    const iframe = iframeRef.current;
    if (!iframe || iframe.contentDocument?.readyState !== 'complete') return;
    const doc = iframe.contentDocument;
    if (!doc?.body) return;
    try {
      injectIframeNav(doc, pages, activePage, data.theme.palette, setActivePage);
    } catch { /* sandboxed */ }
  }, [pages, activePage, activePageData?.id, data.theme.palette, setActivePage]);

  // Handle postMessages from iframes (page updates + navigation)
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'sidesmith:page-update' && activePage !== 'home') {
        updatePage(activePage, e.data.html as string);
      }
      if (e.data?.type === 'sidesmith:navigate') {
        const targetId = hrefToPageId(e.data.href as string, pages);
        if (targetId !== null) setActivePage(targetId);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [activePage, updatePage, pages, setActivePage]);

  // Intercept nav clicks on the home page to switch page tabs
  useEffect(() => {
    if (!hasContent) return;
    const container = homeContentRef.current;
    if (!container) return;

    const handleNavClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest('a');
      if (!a) return;
      const href = (a.getAttribute('href') || '').trim();
      if (!href || href.startsWith('#') || /^(https?:|\/\/|mailto:|tel:)/.test(href)) return;
      const targetId = hrefToPageId(href, pages);
      if (targetId !== null) {
        e.preventDefault();
        setActivePage(targetId);
      }
    };

    container.addEventListener('click', handleNavClick);
    return () => container.removeEventListener('click', handleNavClick);
  }, [hasContent, pages, setActivePage]);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#0b0b12] relative">
      <BrowserBar label={urlLabel} />
      <PageTabBar />

      {/* Main content area */}
      <div
        className="flex-1 overflow-y-auto min-h-0"
        style={hasContent && activePage === 'home' ? siteVars : {}}
      >
        {activePageData ? (
          <iframe
            ref={iframeRef}
            key={activePageData.id}
            srcDoc={activePageData.html}
            title={activePageData.name}
            className="w-full border-none block"
            style={{ height: '100%', minHeight: '600px' }}
            sandbox="allow-same-origin allow-scripts"
            onLoad={() => {
              const iframe = iframeRef.current;
              if (!iframe) return;
              try {
                const iwin = iframe.contentWindow as any;
                const doc = iframe.contentDocument;
                if (!doc?.body) return;
                if (!iwin.__smNavActive) {
                  iwin.__smNavActive = true;
                  const navScript = doc.createElement('script');
                  navScript.textContent = NAV_INTERCEPT_SCRIPT;
                  doc.body.appendChild(navScript);
                }
                if (isEditMode && !iwin.__smEditorActive) {
                  const editScript = doc.createElement('script');
                  editScript.textContent = buildEditorScript(data.theme.palette);
                  doc.body.appendChild(editScript);
                }
                // Inject nav from live React state — captures current pages/activePage
                // from this render's closure, so it's always up to date.
                injectIframeNav(doc, pages, activePage, data.theme.palette, setActivePage);
              } catch { /* sandboxed */ }
            }}
          />
        ) : hasContent ? (
          <>
            <HomePageNav
              pages={pages}
              activePage={activePage}
              setActivePage={setActivePage}
              palette={data.theme.palette}
            />
            <div
              ref={homeContentRef}
              style={{
                background: data.theme.palette.background,
                color: data.theme.palette.foreground,
                minHeight: '100%',
              }}
              className="p-3"
            >
              <Builder />
            </div>
          </>
        ) : (
          <EmptyPreview />
        )}
      </div>

      {/* Save button — home page only (iframe changes auto-save via postMessage) */}
      {hasChanges && activePage === 'home' && (
        <button
          onClick={saveChanges}
          className="absolute bottom-5 right-5 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7c3aed] text-white text-[13px] font-semibold shadow-xl hover:bg-[#6d28d9] active:scale-95 transition-all z-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2M7 11l5 5m0 0l5-5m-5 5V3" />
          </svg>
          Save changes
        </button>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <CaptureProvider>
    <BuilderProvider>
      <EditModeProvider>
        <Suspense>
          <SiteLoader />
        </Suspense>
        <div className="h-screen flex flex-col overflow-hidden bg-[#08080d]">
          <TopBar />
          <div className="flex flex-1 overflow-hidden">
            <aside className="w-[360px] flex-shrink-0 flex flex-col border-r border-zinc-200">
              <ChatWidget />
            </aside>
            <PreviewPane />
          </div>
        </div>
      </EditModeProvider>
    </BuilderProvider>
    </CaptureProvider>
  );
}
