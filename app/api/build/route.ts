import { NextRequest } from 'next/server';
import { z } from 'zod';
import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { MODEL } from '@/lib/models';

export const maxDuration = 30;

const OutputSchema = z.object({
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

// Works with either direct OpenAI or Vercel AI Gateway:
// - OPENAI_API_KEY (required)
// - OPENAI_BASE_URL (optional; set to your Vercel AI Gateway Base URL to route through it)
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL, // if unset, uses api.openai.com
});

export async function POST(req: NextRequest) {
  const { brief, preferences } = await req.json();

  const system = `You are a senior brand and product web designer.
Return ONLY a JSON object matching the schema. Adapt copy, structure, and visual mood to the user's preferences.
- Style options include: professional, relaxed, playful, minimal, bold.
- Output a cohesive theme palette as HSL triplets without 'hsl()' wrapper (e.g. "220 10% 98%").
- Use placeholder images from https://picsum.photos/seed/{slug}/800/600.
- Make text specific to the idea/business in the brief.
- Keep it mobile-first, polished and modern.
`;

  const user = `Brief: ${brief}
Preferences: ${JSON.stringify(preferences ?? {}, null, 2)}`;

  const { object } = await generateObject({
    model: openai(MODEL),
    system,
    prompt: user,
    schema: OutputSchema,
    temperature: 0.8,
  });

  return new Response(JSON.stringify(object), { status: 200, headers: { 'content-type': 'application/json' } });
}
