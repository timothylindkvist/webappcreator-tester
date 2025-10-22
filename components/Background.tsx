'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useBuilder } from '../components/builder-context';

export default function Background() {
  const { data, brief, setData } = useBuilder();
  const [imgUrl, setImgUrl] = useState<string | null>(data?.media?.hero?.url || null);
  const [gradient, setGradient] = useState<{from:string; to:string} | null>(null);
  const [fade, setFade] = useState(false);

  const paletteArray = useMemo(() => {
    const p = data?.theme?.palette || {};
    return Object.values(p);
  }, [data?.theme?.palette]);

  // Trigger generation whenever we have a brief, but lack bg
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!brief) return;
      if (imgUrl || gradient) return;
      try {
        const res = await fetch('/api/images/background', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brief, palette: paletteArray }),
        });
        const json = await res.json();
        if (cancelled) return;
        if (json?.ok && json?.url) {
          if (imgUrl && json.url !== imgUrl) { setFade(true); setTimeout(() => setFade(false), 400); }
          setImgUrl(json.url);
          setGradient(null);
          setData({ ...data, media: { ...(data?.media || {}), hero: { url: json.url } } });
        } else if (json?.ok && json?.gradient) {
          setGradient(json.gradient);
        }
      } catch {}
    }
    run();
    return () => { cancelled = true; };
  }, [brief, imgUrl, gradient]);

  // Respond to persisted bg url changes
  useEffect(() => {
    if (data?.media?.hero?.url !== undefined) {
      if (imgUrl && data.media.hero.url && data.media.hero.url !== imgUrl) { setFade(true); setTimeout(() => setFade(false), 400); }
      setImgUrl(data.media.hero.url || null);
      if (data.media.hero.url) setGradient(null);
    }
  }, [data?.media?.hero?.url]);

  return (
    <>
      {gradient && !imgUrl && (
        <div className="fixed inset-0 -z-20 pointer-events-none" style={{ backgroundImage: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }} />
      )}
      {imgUrl && (
        <div className={fade ? 'fixed inset-0 -z-20 pointer-events-none opacity-0 transition-opacity duration-400' : 'fixed inset-0 -z-20 pointer-events-none opacity-100 transition-opacity duration-400'}
          style={{ backgroundImage: `url(${imgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(2px) brightness(0.85)' }}
        />
      )}
    </>
  );
}
