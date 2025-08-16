'use client';
import { useState } from 'react';
import { z } from 'zod';
import ThemeApplier from './ThemeApplier';
import Hero from './sections/Hero';
import About from './sections/About';
import Services from './sections/Services';
import Gallery from './sections/Gallery';
import Testimonials from './sections/Testimonials';
import CTA from './sections/CTA';

import { Button, Card } from './ui';

export const Schema = z.object({
  theme: z.object({
    palette: z.object({
      background: z.string(),
      foreground: z.string(),
      card: z.string(),
      cardForeground: z.string(),
      primary: z.string(),
      primaryForeground: z.string(),
      accent: z.string(),
      accentForeground: z.string(),
      border: z.string(),
      input: z.string(),
      ring: z.string(),
    })
  }),
  hero: z.object({ title: z.string(), subtitle: z.string(), cta: z.object({ label: z.string() }) }),
  about: z.object({ heading: z.string(), body: z.string(), bullets: z.array(z.string()).max(6) }),
  services: z.object({ items: z.array(z.object({ title: z.string(), description: z.string() })).max(6) }),
  gallery: z.object({ items: z.array(z.object({ title: z.string(), image: z.string().url() })).max(9) }),
  testimonials: z.object({ quotes: z.array(z.object({ quote: z.string(), author: z.string() })).max(6) }),
  cta: z.object({ heading: z.string(), subheading: z.string(), primary: z.object({ label: z.string() }) })
});

export type SiteData = z.infer<typeof Schema>;
type StylePreset = 'professional' | 'relaxed' | 'playful' | 'minimal' | 'bold';

export default function Builder() {
  const [brief, setBrief] = useState('Create a website for a local gym offering classes and personal training.');
  const [style, setStyle] = useState<StylePreset>('professional');
  const [data, setData] = useState<SiteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const build = async (regen = false) => {
    // Only generate if first time or explicit regenerate
    if (data && !regen) { setEditing(true); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/build', {
        method: 'POST',
        body: JSON.stringify({ brief, preferences: { style } }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      const parsed = Schema.parse(json);
      setData(parsed);
      setEditing(true); // default to editing after generation
    } catch (e:any) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  const update = (path: string[], value: any) => {
    setData(prev => {
      if (!prev) return prev;
      const clone: any = structuredClone(prev);
      let target: any = clone;
      for (let i = 0; i < path.length - 1; i++) target = target[path[i]];
      target[path[path.length - 1]] = value;
      return clone;
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <ThemeApplier theme={data?.theme ?? null} />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card className="p-4">
          <h2 className="text-lg font-semibold">Your brief</h2>
          <textarea
            value={brief}
            onChange={(e)=>setBrief(e.target.value)}
            placeholder="Describe the site…"
            className="mt-2 h-32 w-full rounded-xl border border-input bg-transparent p-3 text-sm outline-none" />
          <div className="mt-3">
            <div className="text-xs text-muted-foreground mb-2">Style preset</div>
            <div className="flex flex-wrap gap-2">
              {(['professional','relaxed','playful','minimal','bold'] as StylePreset[]).map(preset => (
                <button key={preset}
                  onClick={()=>setStyle(preset)}
                  className={`rounded-full border px-3 py-1 text-xs ${style===preset ? 'bg-primary text-primary-foreground' : 'bg-transparent'}`}>
                  {preset}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            {!data ? (
              <Button onClick={()=>build(false)} className="flex-1" disabled={loading}>
                {loading ? 'Generating…' : 'Generate'}
              </Button>
            ) : (
              <>
                <Button onClick={()=>setEditing(e=>!e)} className="flex-1">{editing ? 'Close editor' : 'Edit'}</Button>
                <Button onClick={()=>build(true)} className="flex-1" disabled={loading}>
                  {loading ? 'Regenerating…' : 'Regenerate'}
                </Button>
              </>
            )}
          </div>
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          <p className="mt-3 text-xs text-muted-foreground">Model: {process.env.NEXT_PUBLIC_AI_MODEL ?? 'openai/gpt-5'}</p>
        </Card>

        <Card className="col-span-2 p-0">
          {!data && (
            <div className="flex h-full min-h-[520px] items-center justify-center p-10 text-center text-muted-foreground">
              Your generated site will appear here.
            </div>
          )}
          {data && (
            <div className="[&>*:not(:first-child)]:border-t [&>*:not(:first-child)]:border-border/60 relative">
              {/* Rendered site */}
              <Hero {...data.hero} />
              <About {...data.about} />
              <Services {...data.services} />
              <Gallery {...data.gallery} />
              <Testimonials {...data.testimonials} />
              <CTA {...data.cta} />

              {/* Editor panel */}
              {editing && (
                <div className="absolute right-3 top-3 w-full max-w-sm rounded-2xl border border-border/60 bg-card/95 p-4 text-sm shadow-lg backdrop-blur md:right-4 md:top-4">
                  <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Quick editor</div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="col-span-2">
                      <div className="mb-1 text-xs text-muted-foreground">Hero title</div>
                      <input value={data.hero.title} onChange={(e)=>update(['hero','title'], e.target.value)} className="w-full rounded-xl border border-input bg-transparent px-3 py-2 outline-none"/>
                    </label>
                    <label className="col-span-2">
                      <div className="mb-1 text-xs text-muted-foreground">Hero subtitle</div>
                      <textarea value={data.hero.subtitle} onChange={(e)=>update(['hero','subtitle'], e.target.value)} className="h-16 w-full rounded-xl border border-input bg-transparent px-3 py-2 outline-none"/>
                    </label>
                    <label>
                      <div className="mb-1 text-xs text-muted-foreground">CTA label</div>
                      <input value={data.hero.cta.label} onChange={(e)=>update(['hero','cta','label'], e.target.value)} className="w-full rounded-xl border border-input bg-transparent px-3 py-2 outline-none"/>
                    </label>
                    <label>
                      <div className="mb-1 text-xs text-muted-foreground">CTA button</div>
                      <input value={data.cta.primary.label} onChange={(e)=>update(['cta','primary','label'], e.target.value)} className="w-full rounded-xl border border-input bg-transparent px-3 py-2 outline-none"/>
                    </label>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="col-span-2 text-xs uppercase tracking-wide text-muted-foreground">Theme</div>
                    {Object.entries(data.theme.palette).map(([k,v])=> (
                      <label key={k}>
                        <div className="mb-1 text-xs text-muted-foreground">{k}</div>
                        <input value={v} onChange={(e)=>update(['theme','palette',k], e.target.value)} className="w-full rounded-xl border border-input bg-transparent px-3 py-2 outline-none" />
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
