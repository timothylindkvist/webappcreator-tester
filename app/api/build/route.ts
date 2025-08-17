
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { generateObject } from 'ai';
import { MODEL } from '@/lib/models';
import { createGateway } from '@ai-sdk/gateway';

export const maxDuration = 30;

// Any-business output schema (relevant copy, images, palette)
const OutputSchema = z.object({
  theme: z.object({
    vibe: z.string(),
    palette: z.object({
      brand: z.string(),       // CSS color (hsl() or hex)
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
  nav: z.array(z.object({ label: z.string(), href: z.string() })).max(7).optional(),
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

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY, // optional
});

export async function POST(req: NextRequest) {
  const { brief } = await req.json();

  const system = `
You are a senior brand web designer and copywriter.
Given a short brief about ANY business (e.g., cooking blog, car dealer, SaaS, café), return JSON for a tasteful, on-topic landing page.
Requirements:
- Copy must be relevant to the topic and audience; keep it concise, benefit-oriented.
- Choose a color palette that fits the topic (valid CSS colors; prefer hsl() or hex).
- Use placeholder images via https://picsum.photos/seed/{topic}-{index}/800/600 (derive "topic" from the brief).
- Keep URLs generic unless provided.
- Return ONLY JSON matching the schema.
`;

  const { object } = await generateObject({
    model: gateway ? gateway(MODEL) : (MODEL as any),
    system,
    prompt: `Brief: ${brief}`,
    schema: OutputSchema,
    temperature: 0.6,
  });

  return new Response(JSON.stringify(object), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
