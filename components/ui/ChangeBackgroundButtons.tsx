'use client';
import React, { useState } from 'react';
import { useBuilder } from '../builder-context';

export default function ChangeBackgroundButtons() {
  const { brief, data, setData } = useBuilder();
  const [loading, setLoading] = useState(false);

  async function changeBg() {
    if (!brief) return; // do nothing until user has a description
    setLoading(true);
    try {
      const palette = Object.values(data?.theme?.palette || {});
      const res = await fetch('/api/images/background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief, palette }),
      });
      const json = await res.json();
      if (json?.ok && json?.url) {
        setData({
          ...data,
          media: { ...(data?.media || {}), hero: { url: json.url } },
        });
      }
    } catch (e) {
      console.error('Change BG failed', e);
    } finally {
      setLoading(false);
    }
  }

  function removeBg() {
    const clone = { ...data };
    if (clone.media?.hero) {
      clone.media.hero.url = '';
    }
    setData(clone);
  }

  return (
    <div className="fixed bottom-4 right-4 z-20 flex gap-2">
      <button
        onClick={changeBg}
        className="px-3 py-2 rounded-xl shadow bg-[var(--brand)] text-white hover:opacity-90 disabled:opacity-60"
        disabled={loading || !brief}
        title={!brief ? 'Enter a description first' : 'Generate a new background'}
      >
        {loading ? 'Generating…' : 'Change BG'}
      </button>
      <button
        onClick={removeBg}
        className="px-3 py-2 rounded-xl shadow border border-muted bg-[var(--background)] text-[var(--foreground)] hover:bg-muted/20"
      >
        Remove BG
      </button>
    </div>
  );
}
