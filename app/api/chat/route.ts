import Anthropic from '@anthropic-ai/sdk';
import { rateLimit } from '@/lib/ratelimit';
import { MODEL } from '@/lib/models';
import { sanitizeSiteImages } from '@/lib/imageKeywords';
import { detectSectionAdd, detectSectionRemove } from '@/lib/sectionTemplates';
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

CRITICAL — you must ACTUALLY implement every change in the site JSON. Do not describe a change in "reply" without making the corresponding modification to the "site" object. If a visual effect cannot be expressed in the schema, implement the closest possible alternative (e.g. change theme.palette colors, update hero.pattern, rewrite copy) and describe what you did instead.

HERO PATTERN — hero.pattern controls the CSS background design of the hero section. Valid values:
- "dark-grid": subtle white grid on very dark background with brand-color glow (gym, food, events, lifestyle)
- "dot-matrix": small repeating dots on dark background with glow (photography, film, music, media)
- "gradient-mesh": smooth multi-color gradient blobs, dark background (tech, SaaS, creative agencies)
- "light-minimal": clean white with subtle grey grid lines (law, finance, medical, professional, sensitive topics)

When the user says:
- "change hero pattern" / "different pattern" → cycle to the next pattern in the list above
- "make hero lighter" / "light hero" / "white hero" → set to "light-minimal"
- "make hero darker" / "dark hero" → set to "dark-grid"
- "remove the pattern" → set to "gradient-mesh"
- "grid pattern" → set to "dark-grid"; "dots pattern" → "dot-matrix"; "mesh" / "gradient" → "gradient-mesh"

IMPORTANT — preserve emotional tone: if the existing site serves a sensitive audience (grief, death, estate planning, serious illness, mental health, crisis, divorce, elder care), maintain that register throughout all edits. Do not introduce aggressive CTAs, exclamation marks, neon colors, or urgency language when editing these sites.

GALLERY — gallery.displayType controls how the gallery section looks. Valid values:
- "photos": photo grid using images[] with LoremFlickr URLs (https://loremflickr.com/800/600/keyword?lock=N)
- "icon-cards": emoji icons on colored cards; items[]: [{ icon, title, description, color }]
- "feature-cards": stat/number cards; items[]: [{ stat, title, subtitle }]
- "color-blocks": colorful gradient blocks; items[]: [{ gradient, title }]
- "screenshot-mockups": browser frame mockups; items[]: [{ title, accentColor, url }]

When user says "replace images with icons/illustrations/no photos/something colorful/stats/numbers" → update gallery.displayType and regenerate items[] accordingly.
BANNED photo keywords: "fitness", "body", "workout", "gym", "muscle". Use "gym-equipment", "fitness-facility" instead.`;

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

    // Fast path: section remove — find by type/id and delete without regenerating full JSON
    const sectionRemove = detectSectionRemove(lastUserMessage, site);
    if (sectionRemove) {
      if (sectionRemove.kind === 'remove') {
        return Response.json({
          ok: true,
          reply: sectionRemove.reply,
          events: [{ name: 'deleteSection', args: { id: sectionRemove.id } }],
        });
      }
      // kind === 'not-found': section doesn't exist, inform and stop
      return Response.json({ ok: true, reply: sectionRemove.reply, events: [] });
    }

    // Fast path: section add — use pre-built template to avoid JSON truncation
    const sectionAdd = detectSectionAdd(lastUserMessage, site);
    if (sectionAdd) {
      if (sectionAdd.kind === 'already-exists') {
        // Section exists — tell the user rather than letting Claude potentially duplicate it
        return Response.json({ ok: true, reply: sectionAdd.reply, events: [] });
      }
      // kind === 'insert'
      return Response.json({
        ok: true,
        reply: sectionAdd.reply,
        events: [
          {
            name: 'insertSection',
            args: { type: sectionAdd.type, id: sectionAdd.id ?? sectionAdd.type, data: sectionAdd.data },
          },
        ],
      });
    }

    // First attempt
    const firstMessage = await client.messages.create({
      model: MODEL,
      max_tokens: 8192,
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
        max_tokens: 8192,
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
