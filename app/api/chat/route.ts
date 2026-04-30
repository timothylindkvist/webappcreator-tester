import Anthropic from '@anthropic-ai/sdk';
import { rateLimit } from '@/lib/ratelimit';
import { MODEL } from '@/lib/models';
import { NextRequest } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const ChatResponseSchema = z.object({
  reply: z.string(),
  site: z.record(z.any()).optional(),
});

export async function POST(req: NextRequest) {
  const ip = (req.headers.get('x-forwarded-for') || 'anon').split(',')[0];
  const rl = rateLimit(`chat:${ip}`, 30, 60);
  if (!rl.ok) {
    return new Response(JSON.stringify({ error: 'rate_limited', reset: rl.reset }), { status: 429 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ ok: false, error: 'Missing ANTHROPIC_API_KEY' }, { status: 401 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const body = await req.json();
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const site = body?.site || {};
    const brief = typeof body?.brief === 'string' ? body.brief : '';
    const lastUserMessage = [...messages].reverse().find((m: any) => m?.role === 'user')?.content || '';

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: `You are an AI website editor. The user will describe a change to make to their site.
Return ONLY valid JSON — no markdown, no code fences, no explanation.
Shape: {"reply":"one short sentence confirming what you changed","site":{...the complete updated site JSON...}}

Modify only what the user asked for. Keep everything else identical. Keep your reply short.

IMPORTANT — preserve emotional tone: if the existing site serves a sensitive audience (grief, death, estate planning, serious illness, mental health, crisis, divorce, elder care), maintain that register throughout all edits. Do not introduce aggressive CTAs, exclamation marks, neon colors, or urgency language when editing these sites. If the user asks to change colors or copy on a sensitive-topic site, keep the palette calm and muted, and keep copy dignified and unhurried.

IMAGES — if you update any image URLs, use LoremFlickr format: https://loremflickr.com/800/600/keyword1,keyword2?lock=N
Keywords must match what the business actually is (pizza restaurant → "pizza,restaurant", yoga studio → "yoga,wellness"). Never use generic terms like "city", "street", or "transportation" unless the business is about those things. Use different ?lock=N values across gallery images for variety.`,
      messages: [
        {
          role: 'user',
          content: `Brief: ${brief}\n\nCurrent site:\n${JSON.stringify(site, null, 2)}\n\nChange requested: ${lastUserMessage}`,
        },
        { role: 'assistant', content: '{' },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const parsed = ChatResponseSchema.parse(JSON.parse('{' + responseText));

    const events = parsed.site
      ? [{ name: 'setSiteData', args: parsed.site }]
      : [];

    return Response.json({ ok: true, reply: parsed.reply, events });
  } catch (err: any) {
    return Response.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
