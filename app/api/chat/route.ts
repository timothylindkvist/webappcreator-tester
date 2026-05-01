import Anthropic from '@anthropic-ai/sdk';
import { rateLimit } from '@/lib/ratelimit';
import { MODEL } from '@/lib/models';
import { sanitizeSiteImages } from '@/lib/imageKeywords';
import { collectAllOps } from '@/lib/sectionTemplates';
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

function siteEffectivelyChanged(before: Record<string, any>, after: Record<string, any>): boolean {
  const strip = (s: Record<string, any>) => {
    const { blocks: _, ...rest } = s;
    return rest;
  };
  return JSON.stringify(strip(before)) !== JSON.stringify(strip(after));
}

async function callClaude(
  client: Anthropic,
  instruction: string,
  site: Record<string, any>,
  brief: string
): Promise<{ reply: string; siteEvent?: { name: string; args: Record<string, any> } }> {
  const userContent = `Brief: ${brief}\n\nCurrent site:\n${JSON.stringify(site, null, 2)}\n\nChange requested: ${instruction}`;

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
      if (retryParsed.site && siteEffectivelyChanged(site, retryParsed.site)) {
        finalParsed = retryParsed;
      }
    } catch {
      // Retry parse failed — keep first response
    }
  }

  const updatedSite = finalParsed.site ? sanitizeSiteImages(finalParsed.site) : undefined;

  return {
    reply: finalParsed.reply,
    siteEvent: updatedSite ? { name: 'setSiteData', args: updatedSite } : undefined,
  };
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

    // Collect all template-matched operations (adds/removes) and the leftover for Claude
    const ops = collectAllOps(lastUserMessage, site);

    const allEvents: Array<{ name: string; args: Record<string, any> }> = [];
    const allReplies: string[] = [];

    // If there are non-template edits, call Claude for just those
    if (ops.nonTemplateInstruction) {
      const claude = await callClaude(client, ops.nonTemplateInstruction, site, brief);
      allReplies.push(claude.reply);
      // Claude's setSiteData goes first so template inserts run on top of the updated site
      if (claude.siteEvent) allEvents.push(claude.siteEvent);
    }

    // Template events (inserts/deletes) run after Claude's site update
    allEvents.push(...ops.events);
    allReplies.push(...ops.replies);

    // If nothing happened at all, return Claude's no-op reply (happens when Claude returns reply but no site change)
    if (allReplies.length === 0 && allEvents.length === 0) {
      return Response.json({ ok: true, reply: "I didn't find anything to change.", events: [] });
    }

    return Response.json({
      ok: true,
      reply: allReplies.filter(Boolean).join(' '),
      events: allEvents,
    });
  } catch (err: any) {
    return Response.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
