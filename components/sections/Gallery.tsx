'use client';

import { useState } from 'react';

interface BaseItem {
  title?: string;
  caption?: string;
  alt?: string;
  image?: string;
  src?: string;
  icon?: string;
  description?: string;
  color?: string;
  stat?: string;
  subtitle?: string;
  gradient?: string;
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

// ── Vibe inference ────────────────────────────────────────────────────────────

type GalleryVibe = 'outdoor' | 'food' | 'finance' | 'tech' | 'health' | 'creative' | 'general';

function inferVibeFromText(text: string): GalleryVibe {
  const t = text.toLowerCase();
  if (/ski|snow|mountain|alpine|outdoor|hiking|surf|climb|trek|snowboard|golf|sport|athletic|cycle|running|swim/.test(t)) return 'outdoor';
  if (/restaurant|food|cafe|coffee|kitchen|dining|cuisine|pizza|sushi|espresso|latte|bakery|meal|drink|bistro/.test(t)) return 'food';
  if (/financial|finance|boardroom|trading|investment|document|banking|wealth|capital|securities/.test(t)) return 'finance';
  if (/technology|computer|startup|workspace|data.center|software|tech|coding|programming/.test(t)) return 'tech';
  if (/medical|clinic|health|wellness|hospital|pharmacy|dental|yoga|meditation|therapy/.test(t)) return 'health';
  if (/photography|art|studio|creative|design|fashion|boutique|illustration|gallery/.test(t)) return 'creative';
  return 'general';
}

function inferVibe(items: BaseItem[], title?: string): GalleryVibe {
  const text = [title ?? '', ...items.flatMap((it) => [it.alt ?? '', it.src ?? '', it.title ?? '', it.caption ?? ''])].join(' ');
  return inferVibeFromText(text);
}

// ── Context-aware fallback visuals ────────────────────────────────────────────

function OutdoorFallback({ index }: { index: number }) {
  const emojis = ['⛷️', '🏔️', '🌊', '🚵', '🧗', '🏕️'];
  return (
    <div
      className="aspect-[4/3] w-full flex items-center justify-center"
      style={{ background: 'linear-gradient(145deg, #bde0fe 0%, #e0f0ff 50%, #7dd3fc 100%)' }}
    >
      <span className="text-6xl drop-shadow-sm" role="img" aria-hidden="true">{emojis[index % emojis.length]}</span>
    </div>
  );
}

function FoodFallback({ index }: { index: number }) {
  const emojis = ['☕', '🍕', '🍜', '🥗', '🍰', '🍳'];
  return (
    <div
      className="aspect-[4/3] w-full relative flex items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #fef3c7 0%, #fde68a 60%, #fbbf24 100%)' }}
    >
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-25" style={{ background: '#d97706' }} />
      <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full opacity-20" style={{ background: '#b45309' }} />
      <div className="absolute top-1/4 left-1/4 w-10 h-10 rounded-full opacity-15" style={{ background: '#f59e0b' }} />
      <span className="relative z-10 text-6xl drop-shadow-sm" role="img" aria-hidden="true">{emojis[index % emojis.length]}</span>
    </div>
  );
}

function FinanceFallback({ index }: { index: number }) {
  const PRESETS = [
    [55, 80, 45, 70, 90, 60, 75],
    [70, 50, 85, 55, 65, 80, 40],
    [40, 75, 60, 90, 50, 70, 85],
  ];
  const bars = PRESETS[index % PRESETS.length];
  return (
    <div
      className="aspect-[4/3] w-full flex items-end justify-center gap-1.5 px-5 pb-4 pt-8"
      style={{ background: 'linear-gradient(145deg, #1e3a5f, #243b55)' }}
    >
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${h}%`,
            background: i % 2 === 0 ? '#3b82f6' : '#93c5fd',
            opacity: 0.55 + (i % 3) * 0.15,
            borderRadius: '3px 3px 0 0',
          }}
        />
      ))}
    </div>
  );
}

function TechFallback({ index }: { index: number }) {
  const emojis = ['💻', '⚡', '🔮'];
  return (
    <div
      className="aspect-[4/3] w-full relative flex items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #0f172a, #1e1b4b)' }}
    >
      <svg className="absolute inset-0 w-full h-full opacity-[0.18]" viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice">
        {Array.from({ length: 11 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 15} x2="200" y2={i * 15} stroke="#818cf8" strokeWidth="0.8" />
        ))}
        {Array.from({ length: 14 }, (_, i) => (
          <line key={`v${i}`} x1={i * 15} y1="0" x2={i * 15} y2="150" stroke="#818cf8" strokeWidth="0.8" />
        ))}
        {Array.from({ length: 11 }, (_, row) =>
          Array.from({ length: 14 }, (_, col) => (
            <circle key={`d${row}-${col}`} cx={col * 15} cy={row * 15} r="1.5" fill="#a5b4fc" opacity="0.6" />
          ))
        )}
      </svg>
      <span className="relative text-6xl drop-shadow-sm z-10" role="img" aria-hidden="true">{emojis[index % emojis.length]}</span>
    </div>
  );
}

function HealthFallback({ index }: { index: number }) {
  const emojis = ['🌿', '💚', '🧘', '🌱', '✨', '🫀'];
  return (
    <div
      className="aspect-[4/3] w-full relative flex items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #d1fae5 0%, #ecfdf5 50%, #6ee7b7 100%)' }}
    >
      <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice">
        <ellipse cx="30" cy="40" rx="55" ry="38" fill="#059669" />
        <ellipse cx="160" cy="115" rx="65" ry="42" fill="#10b981" />
        <ellipse cx="110" cy="75" rx="45" ry="60" fill="#34d399" />
      </svg>
      <span className="relative text-6xl drop-shadow-sm z-10" role="img" aria-hidden="true">{emojis[index % emojis.length]}</span>
    </div>
  );
}

function CreativeFallback({ index }: { index: number }) {
  const emojis = ['🎨', '✏️', '🖼️'];
  return (
    <div className="aspect-[4/3] w-full relative overflow-hidden flex items-center justify-center">
      <div className="absolute top-0 left-0 w-full h-1/2 opacity-90" style={{ background: 'var(--brand)' }} />
      <div className="absolute bottom-0 left-0 w-full h-1/2 opacity-90" style={{ background: 'var(--accent)' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rotate-45 opacity-10 bg-white" />
      <span className="relative z-10 text-6xl drop-shadow-lg" role="img" aria-hidden="true">{emojis[index % emojis.length]}</span>
    </div>
  );
}

function GeneralFallback({ index }: { index: number }) {
  const emojis = ['✨', '⭐', '🎯'];
  return (
    <div
      className="aspect-[4/3] w-full relative flex items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(145deg, var(--brand), var(--accent))' }}
    >
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice">
        {Array.from({ length: 8 }, (_, row) =>
          Array.from({ length: 11 }, (_, col) => (
            <circle key={`d${row}-${col}`} cx={col * 20 + 10} cy={row * 20 + 10} r="2" fill="white" />
          ))
        )}
      </svg>
      <span className="relative text-6xl drop-shadow-sm z-10" role="img" aria-hidden="true">{emojis[index % emojis.length]}</span>
    </div>
  );
}

function ContextualFallback({ index, vibe }: { index: number; vibe: GalleryVibe }) {
  if (vibe === 'outdoor') return <OutdoorFallback index={index} />;
  if (vibe === 'food') return <FoodFallback index={index} />;
  if (vibe === 'finance') return <FinanceFallback index={index} />;
  if (vibe === 'tech') return <TechFallback index={index} />;
  if (vibe === 'health') return <HealthFallback index={index} />;
  if (vibe === 'creative') return <CreativeFallback index={index} />;
  return <GeneralFallback index={index} />;
}

// ── Photo grid with two-stage image fallback ──────────────────────────────────

function PhotoGridItem({ it, index, vibe }: { it: BaseItem; index: number; vibe: GalleryVibe }) {
  const primarySrc = it.image ?? it.src;
  const keyword = (it.alt ?? it.caption ?? it.title ?? `photo-${index}`).replace(/\s+/g, '-');
  const picsumSrc = `https://picsum.photos/seed/${keyword}/800/600`;

  const [stage, setStage] = useState<'primary' | 'picsum' | 'css'>(primarySrc ? 'primary' : 'css');

  const handleError = (failedSrc: string | undefined, currentStage: 'primary' | 'picsum') => {
    if (currentStage === 'primary') {
      console.warn(`[Gallery] Image failed to load: ${failedSrc} — trying picsum (seed: ${keyword})`);
      setStage('picsum');
    } else {
      console.warn(`[Gallery] Picsum also failed: ${failedSrc} — using CSS fallback (vibe: ${vibe})`);
      setStage('css');
    }
  };

  const caption = it.title ?? it.caption ?? it.alt;
  const displaySrc = stage === 'primary' ? primarySrc : picsumSrc;

  return (
    <figure
      className="group overflow-hidden rounded-2xl"
      style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
    >
      {stage !== 'css' ? (
        <img
          src={displaySrc}
          alt={caption ?? ''}
          className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={() => handleError(displaySrc, stage as 'primary' | 'picsum')}
        />
      ) : (
        <ContextualFallback index={index} vibe={vibe} />
      )}
      {caption && (
        <figcaption className="p-3 text-sm" style={{ color: 'var(--muted)' }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function PhotoGrid({ items, vibe }: { items: BaseItem[]; vibe: GalleryVibe }) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {items.map((it, i) => (
        <PhotoGridItem key={it.src ?? it.image ?? String(i)} it={it} index={i} vibe={vibe} />
      ))}
    </div>
  );
}

// ── Empty-state fallback ──────────────────────────────────────────────────────

function EmptyGalleryFallback({ title, vibe }: { title?: string; vibe: GalleryVibe }) {
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
              <ContextualFallback index={i} vibe={vibe} />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Alternative display types (unchanged) ─────────────────────────────────────

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

  const photoEntries = images ?? (type === 'photos' ? items : undefined) ?? [];
  const altEntries = type !== 'photos' ? (items ?? []) : [];

  const hasContent =
    (type === 'photos' && photoEntries.length > 0) ||
    (type !== 'photos' && altEntries.length > 0);

  const vibe = inferVibe([...photoEntries, ...altEntries], title);

  if (!hasContent) return <EmptyGalleryFallback title={title} vibe={vibe} />;

  return (
    <section className="px-6 py-16" style={{ color: 'var(--foreground)' }}>
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl font-bold sm:text-3xl">{title || 'Gallery'}</h2>

        {type === 'photos' && <PhotoGrid items={photoEntries} vibe={vibe} />}
        {type === 'icon-cards' && <IconCards items={altEntries} />}
        {type === 'feature-cards' && <FeatureCards items={altEntries} />}
        {type === 'color-blocks' && <ColorBlocks items={altEntries} />}
        {type === 'screenshot-mockups' && <ScreenshotMockups items={altEntries} />}
      </div>
    </section>
  );
}
