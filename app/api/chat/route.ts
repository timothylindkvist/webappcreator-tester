import Anthropic from '@anthropic-ai/sdk';
import { rateLimit } from '@/lib/ratelimit';
import { MODEL } from '@/lib/models';
import { sanitizeSiteImages } from '@/lib/imageKeywords';
import { NextRequest } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const ChatResponseSchema = z.object({
  reply: z.string(),
  site: z.record(z.any()).optional(),
});

const SYSTEM_PROMPT = `You are an AI website editor. The user will describe a change to make to their site.
Return ONLY valid JSON — no markdown, no code fences, no explanation.
Shape: {"reply":"one short sentence confirming what you changed","site":{...the complete updated site JSON...}}

Modify only what the user asked for. Keep everything else identical. Keep your reply short.

CRITICAL — you must ACTUALLY implement every change in the site JSON. Do not describe a change in "reply" without making the corresponding modification to the "site" object. If a visual effect cannot be expressed in the schema, implement the closest possible alternative (e.g. change theme.palette colors, update hero.backgroundImage, rewrite copy) and describe what you did instead.

IMPORTANT — preserve emotional tone: if the existing site serves a sensitive audience (grief, death, estate planning, serious illness, mental health, crisis, divorce, elder care), maintain that register throughout all edits. Do not introduce aggressive CTAs, exclamation marks, neon colors, or urgency language when editing these sites. If the user asks to change colors or copy on a sensitive-topic site, keep the palette calm and muted, and keep copy dignified and unhurried.

IMAGES — if you update any image URLs, use LoremFlickr format: https://loremflickr.com/800/600/keyword1,keyword2?lock=N
Keywords must match what the business actually is (pizza restaurant → "pizza,restaurant", yoga studio → "yoga-class,wellness"). Never use generic terms like "city", "street", or "transportation" unless the business is about those things. Use different ?lock=N values across gallery images for variety.
BANNED image keywords (return inappropriate results): "fitness", "body", "workout", "gym", "muscle", "exercise", "training", "sport". Use "gym-equipment", "weight-room", "fitness-facility", "athletic-training" instead.`;

// Compare site objects ignoring the server-inferred `blocks` array.
function siteEffectivelyChanged(before: Record<string, any>, after: Record<string, any>): boolean {
  const strip = (s: Record<string, any>) => {
    const { blocks: _, ...rest } = s;
    return rest;
  };
  return JSON.stringify(strip(before)) !== JSON.stringify(strip(after));
}

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

    const userContent = `Brief: ${brief}\n\nCurrent site:\n${JSON.stringify(site, null, 2)}\n\nChange requested: ${lastUserMessage}`;

    // First attempt
    const firstMessage = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userContent },
        { role: 'assistant', content: '{' },
      ],
    });

    const firstText = firstMessage.content[0].type === 'text' ? firstMessage.content[0].text : '';
    const firstParsed = ChatResponseSchema.parse(JSON.parse('{' + firstText));

    let finalParsed = firstParsed;

    // Verify: if the AI returned a site but it's identical to the input, the change wasn't applied.
    if (firstParsed.site && !siteEffectivelyChanged(site, firstParsed.site)) {
      const retryMessage = await client.messages.create({
        model: MODEL,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: userContent },
          { role: 'assistant', content: '{' + firstText },
          {
            role: 'user',
            content:
              'The site JSON you returned is identical to the input — the change was not applied to the data. You MUST modify the actual site JSON fields. Editable fields include: theme.palette (colors), hero.backgroundImage (LoremFlickr URL), hero.title/subtitle/cta, about/features/gallery/pricing/faq/cta sections. If the exact effect cannot be represented, pick the closest supported alternative and implement it.',
          },
          { role: 'assistant', content: '{' },
        ],
      });

      const retryText = retryMessage.content[0].type === 'text' ? retryMessage.content[0].text : '';
      try {
        const retryParsed = ChatResponseSchema.parse(JSON.parse('{' + retryText));
        // Only use retry if it actually changed something
        if (retryParsed.site && siteEffectivelyChanged(site, retryParsed.site)) {
          finalParsed = retryParsed;
        }
      } catch {
        // Retry parse failed — fall back to first response
      }
    }

    // Sanitize any image URLs in the updated site
    const updatedSite = finalParsed.site ? sanitizeSiteImages(finalParsed.site) : undefined;

    const events = updatedSite ? [{ name: 'setSiteData', args: updatedSite }] : [];

    return Response.json({ ok: true, reply: finalParsed.reply, events });
  } catch (err: any) {
    return Response.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
