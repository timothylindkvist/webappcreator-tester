'use client';

import type { CSSProperties } from 'react';
import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { BuilderProvider, useBuilder } from '../components/builder-context';
import Builder from '../components/Builder';
import ChatWidget from '../components/ChatWidget';

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
        <span className="font-semibold text-white text-[13px] tracking-tight">Sidesmith</span>
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

function PreviewPane() {
  const { data } = useBuilder();
  const hasContent = !!(data.hero?.title);
  const siteName = hasContent
    ? `${(data.brand?.name || 'yoursite').toLowerCase().replace(/\s+/g, '-')}.com`
    : 'yoursite.com';

  const siteVars = deriveSiteVars(data.theme.palette);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#0b0b12]">
      <BrowserBar label={siteName} />
      <div
        className="flex-1 overflow-y-auto"
        style={hasContent ? siteVars : {}}
      >
        {hasContent ? (
          <div style={{ background: data.theme.palette.background, color: data.theme.palette.foreground, minHeight: '100%' }} className="p-3">
            <Builder />
          </div>
        ) : (
          <EmptyPreview />
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <BuilderProvider>
      <Suspense>
        <SiteLoader />
      </Suspense>
      <div className="h-screen flex flex-col overflow-hidden bg-[#08080d]">
        <TopBar />
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-[360px] flex-shrink-0 flex flex-col border-r border-white/[0.06] bg-[#09090f]">
            <ChatWidget />
          </aside>
          <PreviewPane />
        </div>
      </div>
    </BuilderProvider>
  );
}
