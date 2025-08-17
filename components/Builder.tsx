
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
  hero: z.object({ title: z.string(), subtitle: z.string(), badge: z.string().optional(), cta: z.object({ label: z.string(), url: z.string().optional() }) }),
  about: z.object({ heading: z.string(), body: z.string(), bullets: z.array(z.string()).max(6) }),
  features: z.object({ items: z.array(z.object({ title: z.string(), description: z.string() })).max(6) }).optional(),
  gallery: z.object({ items: z.array(z.object({ title: z.string(), image: z.string().url() })).max(9) }).optional(),
  testimonials: z.object({ quotes: z.array(z.object({ quote: z.string(), author: z.string() })).max(6) }).optional(),
  pricing: z.object({
    heading: z.string(),
    plans: z.array(z.object({ name: z.string(), price: z.string(), includes: z.array(z.string()).max(6) })).max(4)
  }).optional(),
  faq: z.object({ items: z.array(z.object({ q: z.string(), a: z.string() })).max(8) }).optional(),
  cta: z.object({ heading: z.string(), subheading: z.string(), primary: z.object({ label: z.string(), url: z.string().optional() }) })
});

type Data = z.infer<typeof Schema>;

export default function Builder() {
  const [brief, setBrief] = useState('Topic: cooking blog for quick family dinners. Brand name: Weeknight Wizard. Audience: busy parents. Tone: warm and practical. Colors: fresh greens, warm neutrals.');
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function build() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/build', { method: 'POST', body: JSON.stringify({ brief }) });
      const json = await res.json();
      const parsed = Schema.safeParse(json);
      if (!parsed.success) {
        throw new Error('Invalid response. ' + parsed.error.message);
      }
      setData(parsed.data);
      // Apply theme tokens
      const r = document.documentElement;
      r.style.setProperty('--brand', parsed.data.theme.palette.brand);
      r.style.setProperty('--accent', parsed.data.theme.palette.accent);
      r.style.setProperty('--bg', parsed.data.theme.palette.background);
      r.style.setProperty('--fg', parsed.data.theme.palette.foreground);
    } catch (e:any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-bold">Website Builder</h1>
      <p className="mt-1 text-muted-foreground">Describe *any* website idea (car site, cooking blog, café, SaaS, portfolio, etc.). We’ll generate a tailored theme and page structure.</p>

      <Card className="mt-6 p-4">
        <textarea
          value={brief}
          onChange={(e)=>setBrief(e.target.value)}
          className="w-full rounded-xl border border-border/60 bg-transparent p-3 outline-none"
          rows={5}
          placeholder="e.g., Car dealership site for electric vehicles. Name: Volt Wheels. Audience: eco-conscious buyers. Tone: modern and confident. Colors: deep blue and lime."
        />
        <div className="mt-3 flex items-center gap-3">
          <Button onClick={build} disabled={loading}>{loading ? 'Building…' : 'Build my site'}</Button>
          {error && <span className="text-sm text-red-500">{error}</span>}
        </div>
      </Card>

      <div className="mt-8">
        <Card className="p-4">
          {!data && (
            <div className="text-muted-foreground">No site yet. Enter a brief and click build.</div>
          )}
          {data && (
            <div className="[&>*:not(:first-child)]:border-t [&>*:not(:first-child)]:border-border/60">
              <Hero {...data.hero} badge={data.brand.industry} />
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
