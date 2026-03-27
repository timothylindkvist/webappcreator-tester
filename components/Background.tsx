'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useBuilder } from '../components/builder-context';

export default function Background() {
  const { data, brief } = useBuilder();
  const [gradient, setGradient] = useState<{ from: string; to: string } | null>(null);
  const [fade, setFade] = useState(false);
  const imageUrl = data?.media?.hero?.url || data?.hero?.backgroundImage || '';

  const paletteArray = useMemo(() => Object.values(data?.theme?.palette || {}), [data?.theme?.palette]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!brief || imageUrl) return;
      try {
        const response = await fetch('/api/images/background', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brief, palette: paletteArray }),
        });
        const json = await response.json();
        if (cancelled) return;
        if (json?.ok && json?.url) {
          (window as any).__sidesmithTools?.setSiteData({
            media: { hero: { url: json.url } },
            hero: { backgroundImage: json.url },
          });
          setGradient(null);
        } else if (json?.ok && json?.gradient) {
          setGradient(json.gradient);
        }
      } catch {
        // ignore background generation errors in UI
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [brief, imageUrl, paletteArray]);

  useEffect(() => {
    if (!imageUrl) return;
    setFade(true);
    const timer = window.setTimeout(() => setFade(false), 350);
    return () => window.clearTimeout(timer);
  }, [imageUrl]);

  return (
    <>
      {gradient && !imageUrl ? (
        <div
          className="fixed inset-0 -z-20 pointer-events-none"
          style={{ backgroundImage: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
        />
      ) : null}
      {imageUrl ? (
        <div
          className={`fixed inset-0 -z-20 pointer-events-none transition-opacity duration-300 ${fade ? 'opacity-90' : 'opacity-100'}`}
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(2px) brightness(0.85)',
          }}
        />
      ) : null}
    </>
  );
}
