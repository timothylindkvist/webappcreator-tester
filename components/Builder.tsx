'use client';
import { useState } from 'react';
import { z } from 'zod';
import Hero from './sections/Hero';
import About from './sections/About';
import Gallery from './sections/Gallery';
import Testimonials from './sections/Testimonials';
import CTA from './sections/CTA';
import Features from './sections/Features';
import Pricing from './sections/Pricing';
import FAQ from './sections/FAQ';
import { Button, Card } from './ui';

export const Schema = z.object({
  theme: z.object({
    vibe: z.string(),
    palette: z.object({
      brand: z.string(),
      accent: z.string(),
      background: z.string(),
      foreground: z.string()
    }),
    font: z.object({ heading: z.string(), body: z.string() }).optional()
  }),
  brand: z.object({
    name: z.string(),
    tagline: z.string(),
    industry: z.string()
  }),
  nav: z.array(z.object({ label: z.string(), href: z.string() })).optional(),

  hero: z.object({
    title: z.string(),
    subtitle: z.string(),
    badge: z.string().optional(),
    cta: z.object({ label: z.string(), url: z.string().optional() })
  }),

  about: z.object({
    heading: z.string(),
    body: z.string(),
    bullets: z.array(z.string()).max(6)
  }),

  features: z.object({
    items: z.array(z.object({ title: z.string(), description: z.string() })).max(6)
  }).optional(),

  gallery: z.object({
    items: z.array(z.object({ title: z.string(), image: z.string().url() })).max(9)
  }).optional(),

  testimonials: z.object({
    quotes: z.array(z.object({ quote: z.string(), author: z.string() })).max(6)
  }).optional(),

  pricing: z.object({
    heading: z.string(),
    plans: z.array(z.object({
      name: z.string(),
      price: z.string(),
      includes: z.array(z.string()).max(6)
    })).max(4)
  }).optional(),

  faq: z.object({
    items: z.array(z.object({ q: z.string(), a: z.string() })).max(8)
  }).optional(),

  cta: z.object({
    heading: z.string(),
    subheading: z.string(),
    primary: z.object({ label: z.string(), url: z.string().optional() })
  })
});

export type SiteData = z.infer<typeof Schema>;

export default function Builder() {
  const [brief, setBrief] = useState('Create a cool website for influencers');
  const [data, setData] = useState<SiteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const build = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/build', { method: 'POST', body: JSON.stringify({ brief }) });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setData(json as SiteData);
    } catch (e:any) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-3 md:flex-row">
        <Card className="w-full p-4 md:w-1/3">
          <h2 className="text-lg font-semibold">Your brief</h2>
          <textarea value={brief} onChange={(e)=>setBrief(e.target.value)} placeholder="Describe the site…" className="mt-2 h-40 w-full rounded-xl border border-input bg-transparent p-3 outline-none" />
          <Button onClick={build} className="mt-3 w-full" disabled={loading}>{loading ? 'Generating…' : 'Generate Site'}</Button>
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          <p className="mt-3 text-xs text-muted-foreground">Model: {process.env.NEXT_PUBLIC_AI_MODEL ?? 'openai/gpt-5'}</p>
        </Card>
        <Card className="w-full p-0 md:w-2/3">
          {!data && (
            <div className="flex h-full min-h-[420px] items-center justify-center p-10 text-center text-muted-foreground">
              Your generated site will appear here.
            </div>
          )}
          {data && (
            <div className="[&>*:not(:first-child)]:border-t [&>*:not(:first-child)]:border-border/60">
              <Hero {...data.hero} />
              <About {...data.about} />
              {data.features && <Features {...data.features} />}
              {data.gallery && <Gallery {...data.gallery} />}
              {data.testimonials && <Testimonials {...data.testimonials} />}
              {data.pricing && <Pricing {...data.pricing} />}
              {data.faq && <FAQ {...data.faq} />}
              <CTA {...data.cta} />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
