import { rateLimit } from '@/lib/ratelimit';
import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';

export const runtime = 'nodejs';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const BuildSchema = z.object({
  theme: z.object({
    palette: z.object({
      brand: z.string(),
      accent: z.string(),
      background: z.string(),
      foreground: z.string(),
    }),
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

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ ok: false, error: 'Missing OPENAI_API_KEY' }, { status: 401 });
  }

  try {
    const { brief } = await req.json();
    if (!brief || typeof brief !== 'string') {
      return Response.json({ ok: false, error: 'Missing or invalid brief' }, { status: 400 });
    }

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-5-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a product designer generating website JSON.
Return only valid JSON with keys like theme, brand, hero, about, features, pricing, faq and cta.
Keep copy concise and realistic. Do not invent business metrics unless the brief explicitly asks for them.`,
        },
        { role: 'user', content: brief },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content?.trim() || '{}';
    const parsed = BuildSchema.parse(JSON.parse(raw));

    let imageUrl = '';
    try {
      const image = await client.images.generate({
        model: 'gpt-image-1',
        prompt: `Professional website hero background for: ${brief}`,
        size: '1536x1024',
      });
      imageUrl = image.data?.[0]?.url || '';
    } catch {
      imageUrl = '';
    }

    const data = {
      ...parsed,
      media: { hero: { url: imageUrl } },
      hero: { ...parsed.hero, backgroundImage: imageUrl || parsed.hero.backgroundImage || '' },
    };

    return Response.json({ ok: true, data: { ...data, blocks: inferBlocks(data) } });
  } catch (err: any) {
    return Response.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
