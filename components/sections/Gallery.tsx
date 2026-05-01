'use client';

import { useState } from 'react';

interface BaseItem {
  title?: string;
  caption?: string;
  alt?: string;
  // photo
  image?: string;
  src?: string;
  // icon-cards
  icon?: string;
  description?: string;
  color?: string;
  // feature-cards
  stat?: string;
  subtitle?: string;
  // color-blocks
  gradient?: string;
  // screenshot-mockups
  accentColor?: string;
  url?: string;
  [key: string]: unknown;
}

interface GalleryProps {
  title?: string;
  displayType?: string;
  items?: BaseItem[];
  images?: BaseItem[];
}

// ── CSS-only fallback visuals ─────────────────────────────────────────────────

// Abstract bar chart — used when an image fails to load or no images are present.
// Uses CSS variables so it always matches the current site palette.
function AbstractBarFallback({ index }: { index: number }) {
  const PRESETS = [
    [55, 80, 45, 70, 90, 60, 75],
    [70, 50, 85, 55, 65, 80, 40],
    [40, 75, 60, 90, 50, 70, 85],
  ];
  const bars = PRESETS[index % PRESETS.length];
  return (
    <div
      className="aspect-[4/3] w-full flex items-end justify-center gap-1.5 px-5 pb-4 pt-8"
      style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}
    >
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${h}%`,
            background: i % 2 === 0 ? 'var(--brand)' : 'var(--accent)',
            opacity: 0.45 + i * 0.07,
            borderRadius: '3px 3px 0 0',
          }}
        />
      ))}
    </div>
  );
}

// ── Photo grid ────────────────────────────────────────────────────────────────

function PhotoGridItem({ it, index }: { it: BaseItem; index: number }) {
  const [imgError, setImgError] = useState(false);
  const src = it.image ?? it.src;
  const caption = it.title ?? it.caption ?? it.alt;
  return (
    <figure
      className="group overflow-hidden rounded-2xl"
      style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={caption ?? ''}
          className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      ) : (
        <AbstractBarFallback index={index} />
      )}
      {caption && (
        <figcaption className="p-3 text-sm" style={{ color: 'var(--muted)' }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function PhotoGrid({ items }: { items: BaseItem[] }) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {items.map((it, i) => (
        <PhotoGridItem key={i} it={it} index={i} />
      ))}
    </div>
  );
}

// ── Empty-state fallback: 3 CSS chart placeholders ────────────────────────────

function EmptyGalleryFallback({ title }: { title?: string }) {
  return (
    <section className="px-6 py-16" style={{ color: 'var(--foreground)' }}>
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl font-bold sm:text-3xl">{title || 'Gallery'}</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <figure
              key={i}
              className="overflow-hidden rounded-2xl"
              style={{ border: '1px solid var(--border)' }}
            >
              <AbstractBarFallback index={i} />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Alternative display types ─────────────────────────────────────────────────

function IconCards({ items }: { items: BaseItem[] }) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
      {items.map((it, i) => (
        <div
          key={i}
          className="flex flex-col items-center rounded-2xl p-6 text-center"
          style={{ background: it.color ?? 'var(--card)', border: '1px solid var(--border)' }}
        >
          <span className="text-4xl mb-3 leading-none" aria-hidden="true">{it.icon ?? '✨'}</span>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{it.title}</h3>
          {it.description && (
            <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)', opacity: 0.8 }}>
              {it.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function FeatureCards({ items }: { items: BaseItem[] }) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
      {items.map((it, i) => (
        <div
          key={i}
          className="rounded-2xl p-6"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="text-4xl font-black leading-none" style={{ color: 'var(--brand)' }}>
            {it.stat ?? it.title}
          </div>
          {it.stat && (
            <h3 className="mt-2 font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{it.title}</h3>
          )}
          {it.subtitle && (
            <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>{it.subtitle}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function ColorBlocks({ items }: { items: BaseItem[] }) {
  const defaultGradients = [
    'linear-gradient(135deg, #7c3aed, #06b6d4)',
    'linear-gradient(135deg, #e05252, #f97316)',
    'linear-gradient(135deg, #2563eb, #0ea5e9)',
    'linear-gradient(135deg, #16a34a, #10b981)',
    'linear-gradient(135deg, #0d0d1a, #7c3aed)',
    'linear-gradient(135deg, #f97316, #eab308)',
  ];
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
      {items.map((it, i) => (
        <div
          key={i}
          className="relative flex items-end overflow-hidden rounded-2xl p-4"
          style={{
            background: it.gradient ?? it.color ?? defaultGradients[i % defaultGradients.length],
            aspectRatio: '4/3',
          }}
        >
          {it.title && (
            <span className="relative z-10 text-sm font-semibold text-white drop-shadow-sm">
              {it.title}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function ScreenshotMockups({ items }: { items: BaseItem[] }) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
      {items.map((it, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl shadow-lg"
          style={{ border: '1px solid var(--border)' }}
        >
          {/* Browser chrome */}
          <div className="flex h-8 items-center gap-1.5 px-3" style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
            <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
            <div
              className="mx-3 flex h-4 flex-1 items-center rounded px-2 text-[10px]"
              style={{ background: 'var(--input)', color: 'var(--muted)' }}
            >
              {it.url || 'app.example.com'}
            </div>
          </div>
          {/* Screen content */}
          <div
            className="p-4"
            style={{ background: it.accentColor ?? 'var(--brand)', minHeight: '160px' }}
          >
            <div className="space-y-2">
              <div className="h-3 w-3/4 rounded bg-white/30" />
              <div className="h-3 w-1/2 rounded bg-white/20" />
              <div className="mt-3 h-20 rounded-xl bg-white/15" />
            </div>
          </div>
          {it.title && (
            <div className="p-3 text-sm font-medium" style={{ background: 'var(--card)', color: 'var(--foreground)' }}>
              {it.title}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function Gallery({ title, displayType, items, images }: GalleryProps) {
  const type = displayType ?? 'photos';

  // Photos use the images[] array; alternatives use items[]
  const photoEntries = images ?? (type === 'photos' ? items : undefined) ?? [];
  const altEntries = type !== 'photos' ? (items ?? []) : [];

  const hasContent =
    (type === 'photos' && photoEntries.length > 0) ||
    (type !== 'photos' && altEntries.length > 0);

  // Never render an invisible blank section — show CSS bar chart placeholders instead
  if (!hasContent) return <EmptyGalleryFallback title={title} />;

  return (
    <section className="px-6 py-16" style={{ color: 'var(--foreground)' }}>
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl font-bold sm:text-3xl">{title || 'Gallery'}</h2>

        {type === 'photos' && <PhotoGrid items={photoEntries} />}
        {type === 'icon-cards' && <IconCards items={altEntries} />}
        {type === 'feature-cards' && <FeatureCards items={altEntries} />}
        {type === 'color-blocks' && <ColorBlocks items={altEntries} />}
        {type === 'screenshot-mockups' && <ScreenshotMockups items={altEntries} />}
      </div>
    </section>
  );
}
