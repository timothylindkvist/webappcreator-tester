'use client';

import { useState } from 'react';
import { useBuilder } from '@/components/builder-context';

const SECTION_LABELS: Record<string, string> = {
  about: 'About',
  features: 'Features',
  gallery: 'Gallery',
  testimonials: 'Testimonials',
  pricing: 'Pricing',
  faq: 'FAQ',
};

const SKIP_NAV = new Set(['hero', 'cta', 'game', 'html', 'history']);

export default function NavBar() {
  const { data, pages, setActivePage } = useBuilder();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = (data.blocks ?? [])
    .filter((b) => !SKIP_NAV.has(b.type))
    .map((b) => ({
      id: b.id,
      label:
        (b.data as any)?.title ||
        (b.data as any)?.heading ||
        SECTION_LABELS[b.type] ||
        b.type,
    }));

  const brandName = data.brand?.name || 'Home';
  const ctaLabel =
    data.hero?.cta?.label ||
    (data.cta as any)?.button?.label ||
    'Get started';

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  if (navLinks.length === 0) return null;

  return (
    <nav
      className="sticky top-0 z-50 rounded-2xl"
      style={{
        background: 'color-mix(in srgb, var(--background) 85%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5">
        {/* Brand */}
        <button
          onClick={() => scrollTo('hero')}
          className="flex-shrink-0 text-sm font-bold transition-opacity hover:opacity-70"
          style={{ color: 'var(--foreground)' }}
        >
          {brandName}
        </button>

        {/* Links — desktop */}
        <div className="hidden flex-1 items-center justify-center gap-6 md:flex">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className="text-[13px] transition-colors hover:opacity-100"
              style={{ color: 'var(--muted)' }}
            >
              {link.label}
            </button>
          ))}
          {pages.map((page) => (
            <button
              key={page.id}
              onClick={() => { setActivePage(page.id); setMenuOpen(false); }}
              className="text-[13px] transition-colors hover:opacity-100"
              style={{ color: 'var(--muted)' }}
            >
              {page.name}
            </button>
          ))}
        </div>

        {/* CTA + hamburger */}
        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            className="hidden rounded-lg px-4 py-1.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 md:block"
            style={{ background: 'var(--brand)' }}
            onClick={() => scrollTo('cta')}
          >
            {ctaLabel}
          </button>

          <button
            className="flex h-8 w-8 flex-col items-center justify-center gap-[5px] md:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
          >
            <span
              className="block h-px w-5 origin-center transition-transform duration-200"
              style={{
                background: 'var(--foreground)',
                transform: menuOpen ? 'rotate(45deg) translate(0, 4px)' : '',
              }}
            />
            <span
              className="block h-px w-5 transition-opacity duration-200"
              style={{
                background: 'var(--foreground)',
                opacity: menuOpen ? 0 : 1,
              }}
            />
            <span
              className="block h-px w-5 origin-center transition-transform duration-200"
              style={{
                background: 'var(--foreground)',
                transform: menuOpen ? 'rotate(-45deg) translate(0, -4px)' : '',
              }}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="flex flex-col gap-1 px-5 pb-4 md:hidden"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className="px-2 py-2.5 text-left text-[13px] transition-colors"
              style={{ color: 'var(--muted)' }}
            >
              {link.label}
            </button>
          ))}
          {pages.map((page) => (
            <button
              key={page.id}
              onClick={() => { setActivePage(page.id); setMenuOpen(false); }}
              className="px-2 py-2.5 text-left text-[13px] transition-colors"
              style={{ color: 'var(--muted)' }}
            >
              {page.name}
            </button>
          ))}
          <button
            className="mt-2 rounded-lg py-2 text-[13px] font-semibold text-white"
            style={{ background: 'var(--brand)' }}
            onClick={() => scrollTo('cta')}
          >
            {ctaLabel}
          </button>
        </div>
      )}
    </nav>
  );
}
