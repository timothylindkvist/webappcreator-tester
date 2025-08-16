'use client';
import { useEffect, useRef, useState } from 'react';

type Tone = 'professional' | 'relaxed' | 'playful' | 'elegant' | 'bold';
type Palette = 'vibrant' | 'neutral' | 'earth' | 'pastel' | 'cyber';
type LayoutDensity = 'cozy' | 'comfortable' | 'compact';

const TONES: Tone[] = ['professional','relaxed','playful','elegant','bold'];
const PALETTES: Palette[] = ['vibrant','neutral','earth','pastel','cyber'];
const DENSITIES: LayoutDensity[] = ['cozy','comfortable','compact'];
const DEFAULT_COMPONENTS = ['hero','about','features','services','pricing','gallery','testimonials','faq','contact','footer'] as const;

export default function Home() {
  const [brief, setBrief] = useState("Make a beautiful site for a boutique coffee roaster with online ordering and story-driven hero.");
  const [industry, setIndustry] = useState("coffee");
  const [tone, setTone] = useState<Tone>('professional');
  const [palette, setPalette] = useState<Palette>('vibrant');
  const [density, setDensity] = useState<LayoutDensity>('comfortable');
  const [brandName, setBrandName] = useState("");
  const [tagline, setTagline] = useState("");
  const [audience, setAudience] = useState("");
  const [primary, setPrimary] = useState("");
  const [accent, setAccent] = useState("");
  const [components, setComponents] = useState<string[]>([...DEFAULT_COMPONENTS]);
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const liveRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!liveRef.current) return;
    const doc = liveRef.current.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(html || `<html><head><meta charset='utf-8'><title>Preview</title><script src='https://cdn.tailwindcss.com'></script></head><body class='min-h-dvh grid place-items-center bg-slate-50'><div class='text-center p-10'><div class='animate-pulse text-2xl font-semibold text-slate-600'>Your site preview will appear here</div><div class='mt-2 text-slate-500'>Click “Generate site” to create a tailored page.</div></div></body></html>`);
    doc.close();
  }, [html]);

  function toggle(what: string) {
    setComponents(cur => cur.includes(what) ? cur.filter(x => x!==what) : [...cur, what]);
  }

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief,
          prefs: {
            industry, tone, palette, layoutDensity: density,
            colors: { primary: primary || undefined, accent: accent || undefined },
            brand: { name: brandName || undefined, tagline: tagline || undefined, audience: audience || undefined },
            components
          }
        })
      });
      const text = await res.text();
      setHtml(text);
    } catch (e: any) {
      alert(e?.message ?? 'Failed to generate');
    } finally {
      setLoading(false);
    }
  }

  async function exportZip() {
    if (!html) return alert('Generate something first');
    const res = await fetch('/api/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ html }) });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'website.zip'; a.click();
    URL.revokeObjectURL(url);
  }

  const pill = (active: boolean) => active ? 'bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white border-transparent' : 'bg-white/70 dark:bg-white/5 border-black/5 dark:border-white/10';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[560px_1fr] gap-4 p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="glass panel space-y-4 animate-enter">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold"><span className="text-grad">Universal Website Generator</span></h1>
          <button onClick={()=>setHtml('')} className="px-3 py-1.5 rounded-xl bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10">Clear</button>
        </div>

        <label className="block text-sm font-medium opacity-80">Project brief</label>
        <textarea value={brief} onChange={e=>setBrief(e.target.value)} rows={5} className="w-full resize-none rounded-xl p-3 outline-none bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10 focus:ring-2 focus:ring-fuchsia-400/40" />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium opacity-80">Industry / niche</label>
            <input value={industry} onChange={e=>setIndustry(e.target.value)} placeholder="e.g. restaurant, yoga, fintech" className="w-full rounded-xl p-2.5 bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10" />
          </div>
          <div>
            <label className="block text-sm font-medium opacity-80">Audience (optional)</label>
            <input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="e.g. SMB owners, Gen Z, parents" className="w-full rounded-xl p-2.5 bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10" />
          </div>
          <div>
            <label className="block text-sm font-medium opacity-80">Brand name (optional)</label>
            <input value={brandName} onChange={e=>setBrandName(e.target.value)} placeholder="e.g. Northbean" className="w-full rounded-xl p-2.5 bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10" />
          </div>
          <div>
            <label className="block text-sm font-medium opacity-80">Tagline (optional)</label>
            <input value={tagline} onChange={e=>setTagline(e.target.value)} placeholder="e.g. Crafted in small batches" className="w-full rounded-xl p-2.5 bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium opacity-80">Tone</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {TONES.map(t => (
                <button key={t} onClick={()=>setTone(t)} className={`px-3 py-1.5 rounded-full border ${pill(tone===t)}`}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium opacity-80">Palette</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {PALETTES.map(p => (
                <button key={p} onClick={()=>setPalette(p)} className={`px-3 py-1.5 rounded-full border ${pill(palette===p)}`}>{p}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium opacity-80">Layout density</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {DENSITIES.map(d => (
                <button key={d} onClick={()=>setDensity(d)} className={`px-3 py-1.5 rounded-full border ${pill(density===d)}`}>{d}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium opacity-80">Primary color (hex optional)</label>
            <input value={primary} onChange={e=>setPrimary(e.target.value)} placeholder="#b21cff" className="w-full rounded-xl p-2.5 bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10"/>
          </div>
          <div>
            <label className="block text-sm font-medium opacity-80">Accent color (hex optional)</label>
            <input value={accent} onChange={e=>setAccent(e.target.value)} placeholder="#4b73ff" className="w-full rounded-xl p-2.5 bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10"/>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium opacity-80">Sections</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {DEFAULT_COMPONENTS.map(c => (
              <button key={c} onClick={()=>toggle(c)} className={`px-3 py-1.5 rounded-full border ${pill(components.includes(c))}`}>{c}</button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={generate} disabled={loading} className="px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white font-medium shadow-lg shadow-fuchsia-500/20 disabled:opacity-60">{loading?"Generating…":"Generate site"}</button>
          <button onClick={exportZip} className="px-4 py-2 rounded-xl bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10">Export .zip</button>
        </div>

        <p className="text-xs opacity-75">GPT‑5 via Vercel AI Gateway. Output is a complete HTML page styled with Tailwind CDN.</p>
      </div>

      <div className="glass panel p-0 min-h-[70dvh] overflow-hidden relative">
        <iframe ref={liveRef} className="w-full h-[75dvh] rounded-2xl" sandbox="allow-same-origin allow-scripts allow-forms allow-modals" />
      </div>
    </div>
  );
}
