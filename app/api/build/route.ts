import Anthropic from '@anthropic-ai/sdk';
import { rateLimit } from '@/lib/ratelimit';
import { MODEL } from '@/lib/models';
import { NextRequest } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const PaletteSchema = z.object({
  brand: z.string(),
  accent: z.string(),
  background: z.string(),
  foreground: z.string(),
});

const BuildSchema = z.object({
  theme: z.object({
    palette: PaletteSchema,
    density: z.enum(['compact', 'cozy', 'comfortable']).optional(),
    vibe: z.string().optional(),
  }),
  brand: z.object({
    name: z.string().default(''),
    tagline: z.string().default(''),
    industry: z.string().optional(),
  }).default({ name: '', tagline: '' }),
  hero: z.object({
    title: z.string(),
    subtitle: z.string(),
    cta: z.object({ label: z.string(), href: z.string().optional() }).optional(),
    metrics: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
    backgroundImage: z.string().optional(),
  }),
  about: z.object({
    heading: z.string().optional(),
    body: z.string().optional(),
    bullets: z.array(z.string()).optional(),
  }).optional(),
  features: z.object({
    title: z.string().optional(),
    items: z.array(z.object({ title: z.string(), body: z.string().optional(), description: z.string().optional() })).optional(),
  }).optional(),
  pricing: z.object({
    title: z.string().optional(),
    plans: z.array(z.object({ name: z.string(), price: z.string().optional(), features: z.array(z.string()).optional() })).optional(),
  }).optional(),
  faq: z.object({
    title: z.string().optional(),
    items: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
  }).optional(),
  cta: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    button: z.object({ label: z.string(), href: z.string().optional() }).optional(),
  }).optional(),
}).passthrough();

// Claude sometimes returns flat arrays or flattened theme — normalize before validating.
function normalize(raw: Record<string, any>): Record<string, any> {
  const out = { ...raw };

  // theme: { brand, accent, ... } -> theme: { palette: { brand, accent, ... } }
  if (out.theme && typeof out.theme === 'object' && !out.theme.palette) {
    const { vibe, density, typography, background: bg, ...colors } = out.theme;
    // if the theme has color keys at top level, wrap them in palette
    if (colors.brand || colors.accent) {
      out.theme = { palette: { brand: colors.brand, accent: colors.accent, background: colors.background ?? bg ?? '#09090b', foreground: colors.foreground ?? '#fafafa' }, vibe, density, typography };
    }
  }

  // features: [...] -> features: { items: [...] }
  if (Array.isArray(out.features)) out.features = { items: out.features };

  // faq: [...] -> faq: { items: [...] }
  if (Array.isArray(out.faq)) out.faq = { items: out.faq };

  // testimonials: [...] -> testimonials: { items: [...] }
  if (Array.isArray(out.testimonials)) out.testimonials = { items: out.testimonials };

  // pricing: [...] -> pricing: { plans: [...] }
  if (Array.isArray(out.pricing)) out.pricing = { plans: out.pricing };

  // gallery: [...] -> gallery: { images: [...] }
  if (Array.isArray(out.gallery)) out.gallery = { images: out.gallery };

  return out;
}

function inferBlocks(site: z.infer<typeof BuildSchema> & Record<string, any>) {
  const order = ['hero', 'about', 'features', 'gallery', 'testimonials', 'pricing', 'faq', 'cta', 'game', 'history', 'html'];
  return order
    .filter((key) => site[key] != null)
    .map((key) => ({ id: key, type: key, data: site[key] }));
}

export async function POST(req: NextRequest) {
  const ip = (req.headers.get('x-forwarded-for') || 'anon').split(',')[0];
  const rl = rateLimit(`build:${ip}`, 30, 60);
  if (!rl.ok) {
    return new Response(JSON.stringify({ error: 'rate_limited', reset: rl.reset }), { status: 429 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ ok: false, error: 'Missing ANTHROPIC_API_KEY' }, { status: 401 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const { brief } = await req.json();
    if (!brief || typeof brief !== 'string') {
      return Response.json({ ok: false, error: 'Missing or invalid brief' }, { status: 400 });
    }

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: `You are a product designer generating website JSON. Return ONLY valid JSON — no markdown, no code fences, no explanation.

Use exactly this structure:
{
  "theme": { "palette": { "brand": "#hex", "accent": "#hex", "background": "#hex", "foreground": "#hex" }, "vibe": "string" },
  "brand": { "name": "string", "tagline": "string" },
  "hero": { "title": "string", "subtitle": "string", "cta": { "label": "string" } },
  "about": { "heading": "string", "body": "string", "bullets": ["string"] },
  "features": { "title": "string", "items": [{ "title": "string", "description": "string" }] },
  "pricing": { "title": "string", "plans": [{ "name": "string", "price": "string", "features": ["string"] }] },
  "faq": { "title": "string", "items": [{ "q": "string", "a": "string" }] },
  "cta": { "title": "string", "subtitle": "string", "button": { "label": "string" } }
}

Choose a color palette that fits the brand. Keep copy concise and realistic.`,
      messages: [
        { role: 'user', content: brief },
        { role: 'assistant', content: '{' },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const raw = normalize(JSON.parse('{' + responseText));
    const parsed = BuildSchema.parse(raw);

    const data = {
      ...parsed,
      media: { hero: { url: '' } },
      hero: { ...parsed.hero, backgroundImage: '' },
    };

    return Response.json({ ok: true, data: { ...data, blocks: inferBlocks(data) } });
  } catch (err: any) {
    return Response.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
