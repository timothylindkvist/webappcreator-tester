'use client';
import React, { useState } from 'react';
import { useBuilder } from '../builder-context';

export default function ChangeBackgroundButtons() {
  const { brief, data } = useBuilder();
  const [loading, setLoading] = useState(false);

  async function changeBg() {
    if (!brief) return;
    setLoading(true);
    try {
      const palette = Object.values((data as any)?.theme?.palette || {});
      const r = await fetch('/api/images/background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief, palette }),
      });
      const j = await r.json();
      if (j?.ok && j?.url) {
        (window as any).__sidesmithTools?.setSiteData({ media: { hero: { url: j.url } } });
      } else if (j?.ok && j?.gradient) {
        (window as any).__sidesmithTools?.updateBrief({ brief });
      }
    } catch {}
    setLoading(false);
  }

  function removeBg() {
    (window as any).__sidesmithTools?.setSiteData({ media: { hero: { url: '' } } });
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex gap-2">
      <button onClick={changeBg} disabled={loading || !brief} className="px-3 py-2 rounded-xl border border-white/30 bg-transparent text-[var(--foreground)] hover:bg-white/10 disabled:opacity-60">
        {loading ? 'Generating…' : 'Change BG'}
      </button>
      <button onClick={removeBg} className="px-3 py-2 rounded-xl border border-white/30 bg-transparent text-[var(--foreground)] hover:bg-white/10">
        Remove BG
      </button>
    </div>
  );
}
