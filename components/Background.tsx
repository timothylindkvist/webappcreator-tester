'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useBuilder } from '../components/builder-context'; // full context with setData

export default function Background() {
  const { data, brief, setData } = useBuilder();
  const [imgUrl, setImgUrl] = useState<string | null>(data?.media?.hero?.url || null);
  const [gradient, setGradient] = useState<{from:string; to:string} | null>(null);

  // Derive palette for requests
  const paletteArray = useMemo(() => {
    const p = data?.theme?.palette || {};
    return Object.values(p);
  }, [data?.theme?.palette]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!brief) return; // keep white before any prompt

      try {
        const res = await fetch('/api/images/background', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brief, palette: paletteArray }),
        });
        const json = await res.json();

        if (cancelled) return;
        if (json?.ok && json?.url) {
          setImgUrl(json.url);
          // persist into site data
          setData({
            ...data,
            media: { ...(data?.media || {}), hero: { url: json.url } },
          });
          setGradient(null);
        } else if (json?.ok && json?.gradient) {
          setGradient(json.gradient);
        } else {
          // keep white — no fallback when API errors per product requirement
          setGradient(null);
        }
      } catch (e) {
        console.error('Background generation error', e);
        // keep white — no implicit fallback
      }
    }
    run();
    return () => { cancelled = true; };
  }, [brief]);

  // If we already have a persisted image, show it immediately
  useEffect(() => {
    if (data?.media?.hero?.url) {
      setImgUrl(data.media.hero.url);
      setGradient(null);
    }
  }, [data?.media?.hero?.url]);

  return (
    <>
      {/* White is the default (no element needed) */}
      {/* Static gradient layer */}
      {gradient && !imgUrl && (
        <div
          className="fixed inset-0 -z-20 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
          }}
        />
      )}

      {/* DALL·E image layer */}
      {imgUrl && (
        <div
          className="fixed inset-0 -z-20 pointer-events-none"
          style={{
            backgroundImage: `url(${imgUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(2px) brightness(0.85)',
          }}
        />
      )}
    </>
  );
}
