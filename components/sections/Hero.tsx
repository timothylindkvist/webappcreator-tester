'use client';

import React, { useEffect, useState } from 'react';
import { PATTERN_LIGHT_TEXT, VALID_PATTERNS } from '@/lib/heroPatterns';
import type { PatternId } from '@/lib/heroPatterns';

interface HeroProps {
  title?: string;
  subtitle?: string;
  cta?: { label: string; href?: string };
  backgroundImage?: string;
  pattern?: string;
  metrics?: { value: string; label: string }[];
}

function PatternBg({ pattern }: { pattern: PatternId }) {
  switch (pattern) {
    case 'dark-grid':
      return (
        <>
          <div
            className="absolute inset-0 -z-20"
            style={{
              backgroundColor: '#0a0a0f',
              backgroundImage: [
                'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
                'linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
              ].join(', '),
              backgroundSize: '40px 40px',
            }}
          />
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 50% 40%, color-mix(in srgb, var(--brand) 35%, transparent), transparent)',
            }}
          />
        </>
      );

    case 'dot-matrix':
      return (
        <>
          <div
            className="absolute inset-0 -z-20"
            style={{
              backgroundColor: '#07080e',
              backgroundImage:
                'radial-gradient(circle, rgba(255,255,255,0.22) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                'radial-gradient(ellipse 70% 70% at 50% 50%, color-mix(in srgb, var(--brand) 40%, transparent), transparent)',
            }}
          />
        </>
      );

    case 'gradient-mesh':
      return (
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: [
              'radial-gradient(ellipse 70% 80% at 20% 30%, color-mix(in srgb, var(--brand) 50%, transparent), transparent)',
              'radial-gradient(ellipse 60% 70% at 80% 70%, color-mix(in srgb, var(--accent) 35%, transparent), transparent)',
              '#0d0d1a',
            ].join(', '),
          }}
        />
      );

    case 'light-minimal':
      return (
        <>
          <div
            className="absolute inset-0 -z-20"
            style={{
              backgroundColor: '#fafafa',
              backgroundImage: [
                'linear-gradient(rgba(0,0,0,0.045) 1px, transparent 1px)',
                'linear-gradient(90deg, rgba(0,0,0,0.045) 1px, transparent 1px)',
              ].join(', '),
              backgroundSize: '32px 32px',
            }}
          />
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                'radial-gradient(ellipse 70% 40% at 50% 0%, color-mix(in srgb, var(--brand) 10%, transparent), transparent)',
            }}
          />
        </>
      );

    default:
      return null;
  }
}

export default function Hero({ title, subtitle, cta, backgroundImage, pattern, metrics = [] }: HeroProps) {
  const resolvedPattern = VALID_PATTERNS.has(pattern ?? '') ? (pattern as PatternId) : undefined;
  const lightText = resolvedPattern
    ? PATTERN_LIGHT_TEXT[resolvedPattern]
    : !!backgroundImage;

  const [loaded, setLoaded] = useState(!!resolvedPattern || !backgroundImage);

  useEffect(() => {
    if (resolvedPattern || !backgroundImage) {
      setLoaded(true);
      return;
    }
    const img = new Image();
    img.src = backgroundImage;
    img.onload = () => setLoaded(true);
    img.onerror = () => setLoaded(true);
  }, [backgroundImage, resolvedPattern]);

  return (
    <section
      className={`relative isolate overflow-hidden rounded-3xl px-6 py-20 text-center transition-opacity duration-700 sm:py-28 md:py-32 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      style={
        !resolvedPattern && backgroundImage
          ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : undefined
      }
    >
      {resolvedPattern ? (
        <PatternBg pattern={resolvedPattern} />
      ) : backgroundImage ? (
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/25 via-black/45 to-black/70" />
      ) : null}

      <div className={`relative mx-auto max-w-3xl ${lightText ? 'text-white' : 'text-[var(--foreground)]'}`}>
        {title ? (
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl">{title}</h1>
        ) : null}
        {subtitle ? (
          <p className={`mx-auto mt-4 max-w-2xl text-base sm:text-lg ${lightText ? 'text-white/80' : 'text-[var(--muted)]'}`}>
            {subtitle}
          </p>
        ) : null}

        {cta?.label ? (
          <div className="mt-8 flex items-center justify-center gap-3">
            {cta.href ? (
              <a
                href={cta.href}
                className="rounded-2xl bg-[var(--brand)] px-6 py-3 font-semibold text-white shadow-md transition-all hover:opacity-90"
              >
                {cta.label}
              </a>
            ) : (
              <button className="rounded-2xl bg-[var(--brand)] px-6 py-3 font-semibold text-white shadow-md transition-all hover:opacity-90">
                {cta.label}
              </button>
            )}
          </div>
        ) : null}

        {metrics.length > 0 ? (
          <div
            className={`mx-auto mt-10 max-w-3xl rounded-2xl border p-3 text-sm shadow-lg sm:p-4 ${
              lightText
                ? 'border-white/20 bg-white/10 backdrop-blur-sm'
                : 'border-black/10 bg-black/5'
            }`}
          >
            <div className="grid grid-cols-1 gap-3 text-center sm:grid-cols-3">
              {metrics.map((metric, index) => (
                <div key={`${metric.label}-${index}`}>
                  <span className={`text-2xl font-bold ${lightText ? 'text-white' : 'text-[var(--brand)]'}`}>
                    {metric.value}
                  </span>
                  <div className={lightText ? 'text-white/70' : 'text-[var(--muted)]'}>{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
