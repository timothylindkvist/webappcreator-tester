'use client';

import { useEffect, useRef, useState } from 'react';

function IconSparkles(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 2l1.8 4.8L18 8.6l-4.2 1.8L12 15l-1.8-4.6L6 8.6l4.2-1.8L12 2zM4 14l1 2.5 2.5 1L6 20l-1-2.5L2.5 16 4 14zm12 2l1.5 3.5L21 21l-3.5 1-1.5 3.5L14.5 22 11 21l3.5-1 1.5-4z" fill="currentColor"/>
    </svg>
  )
}

export default function Home() {
  const [prompt, setPrompt] = useState("Create a cool website for influencers with vibrant gradients, a hero with CTA, metrics, portfolio grid, testimonials, and a contact form.");
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [seed, setSeed] = useState<string>(() => Math.random().toString(36).slice(2));
  const liveRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!liveRef.current || !html) return;
    const doc = liveRef.current.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
  }, [html, seed]);

  async function generate() {
    try {
      setLoading(true);
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // stream into the preview as it arrives
        setHtml(buffer);
      }
    } catch (e: any) {
      alert(e?.message ?? 'Failed to generate');
    } finally {
      setLoading(false);
    }
  }

  async function exportZip() {
    if (!html) return alert('Generate something first');
    const res = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'influencer-site.zip'; a.click();
    URL.revokeObjectURL(url);
  }

  const presets = [
    "Creator portfolio for a travel influencer with Reels-style grid and brand collab section",
    "Tech YouTuber landing with video embeds, gear shelf, newsletter signup, sponsorship CTA",
    "Twitch streamer profile with schedule, clips grid, tip/donate CTA, animated overlays",
    "Photographer showcase with masonry gallery, EXIF tooltips, light/dark toggle"
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[520px_1fr] gap-4 p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="glass panel space-y-4 animate-enter">
        <div className="flex items-center gap-2">
          <IconSparkles className="w-5 h-5 text-fuchsia-400" />
          <h1 className="text-2xl font-semibold"><span className="text-grad">Influencer Site Generator</span></h1>
        </div>
        <p className="text-sm opacity-80">Describe the vibe & goals. I’ll craft a production‑ready page with Tailwind via CDN for live preview.</p>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={8}
          className="w-full resize-none rounded-xl p-3 outline-none bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10 focus:ring-2 focus:ring-fuchsia-400/40"
        />

        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => setPrompt(p)}
              className="px-3 py-1.5 rounded-full text-sm bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:bg-white/90 dark:hover:bg-white/[.08] transition"
            >
              {p.split(' ').slice(0,3).join(' ')}…
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={generate}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white font-medium shadow-lg shadow-fuchsia-500/20 disabled:opacity-60"
          >
            {loading ? "Thinking…" : "Generate site"}
          </button>
          <button
            onClick={exportZip}
            className="px-4 py-2 rounded-xl bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10"
          >
            Export .zip
          </button>
          <button
            onClick={() => setSeed(Math.random().toString(36).slice(2))}
            className="px-4 py-2 rounded-xl bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10"
            title="Reset iframe"
          >
            Reset preview
          </button>
        </div>

        <p className="text-xs opacity-75">Powered by <strong>GPT‑5</strong> via Vercel AI Gateway (no API key in code).</p>
      </div>

      <div className="glass panel p-0 min-h-[70dvh] overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none rounded-2xl animate-glow" />
        <iframe
          ref={liveRef}
          className="w-full h-[75dvh] rounded-2xl"
          sandbox="allow-same-origin allow-scripts allow-forms allow-modals"
        />
      </div>
    </div>
  );
}
