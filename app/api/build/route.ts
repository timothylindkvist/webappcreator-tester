import { NextRequest } from 'next/server';
import { z } from 'zod';
import { generateObject } from 'ai';
import { MODEL } from '@/lib/models';
import { createGateway } from '@ai-sdk/gateway';

export const maxDuration = 30;

const OutputSchema = z.object({
  hero: z.object({ title: z.string(), subtitle: z.string(), cta: z.object({ label: z.string() }) }),
  about: z.object({ heading: z.string(), body: z.string(), bullets: z.array(z.string()).max(6) }),
  gallery: z.object({ items: z.array(z.object({ title: z.string(), image: z.string().url() })).max(9) }),
  testimonials: z.object({ quotes: z.array(z.object({ quote: z.string(), author: z.string() })).max(6) }),
  cta: z.object({ heading: z.string(), subheading: z.string(), primary: z.object({ label: z.string() }) })
});

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

export async function POST(req: NextRequest) {
  const { brief } = await req.json();

  const system = `You are a senior brand web designer. Given a brief, output a JSON object matching the provided Zod schema. Use vibrant purple→pink gradients with cyan accents, mobile-first, and influencer aesthetics. Use placeholder images via https://picsum.photos/seed/{slug}/800/600.`;

  const { object } = await generateObject({
    model: gateway(MODEL),
    system,
    prompt: `Brief: ${brief}`,
    schema: OutputSchema,
    temperature: 0.7,
  });

  return new Response(JSON.stringify(object), { status: 200, headers: { 'content-type': 'application/json' } });
}
