import Anthropic from '@anthropic-ai/sdk';
import { rateLimit } from '@/lib/ratelimit';
import { MODEL } from '@/lib/models';
import { sanitizeSiteImages, extractVisualKeywords, buildProfessionalImageUrls } from '@/lib/imageKeywords';
import { collectAllOps } from '@/lib/sectionTemplates';
import { generatePage } from '@/lib/pageGenerator';
import { NextRequest } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const ChatResponseSchema = z.object({
  reply: z.string(),
  site: z.record(z.any()).optional(),
});

const SYSTEM_PROMPT = `You are an AI website editor. The user will describe a change to make to their site.
Return ONLY valid JSON — no markdown, no code fences, no explanation.
Shape: {"reply":"1-2 sentences confirming what you changed","site":{...the complete updated site JSON...}}

Modify only what the user asked for. Keep everything else identical.

RESPONSE RULES — non-negotiable:
1. NEVER truncate your reply mid-sentence. Always finish every sentence you start. If you cannot complete a thought, leave it out entirely.
2. NEVER ask for extensive clarification on a clear request. If the user's intent is obvious (even if vague on details), make reasonable design decisions and execute. Explain what you chose afterwards. Only ask ONE brief question when the request is truly ambiguous with no reasonable default.
3. When the user says "make X look like Y" or "match the style of Y page" → identify card styles, typography, spacing, and color usage on the target page, then replicate those patterns on the source page while keeping content unchanged.

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
- "photos": photo grid using images[] with Unsplash featured URLs (https://source.unsplash.com/featured/800x600/?keyword1,keyword2)
- "icon-cards": emoji icons on colored cards; items[]: [{ icon, title, description, color }]
- "feature-cards": stat/number cards; items[]: [{ stat, title, subtitle }]
- "color-blocks": colorful gradient blocks; items[]: [{ gradient, title }]
- "screenshot-mockups": browser frame mockups; items[]: [{ title, accentColor, url }]

When user says "replace images with icons/illustrations/no photos/something colorful/stats/numbers" → update gallery.displayType and regenerate items[] accordingly.

GALLERY IMAGES — always use Unsplash featured URLs: https://source.unsplash.com/featured/800x600/?keyword1,keyword2
Use SPECIFIC, BUSINESS-APPROPRIATE keywords (not generic "business" or "office"):
- Finance/investment → "financial-district", "boardroom", "trading-floor", "document-signing", "city-skyline"
- Tech/SaaS → "technology", "computer", "startup-office", "data-center", "workspace"
- Healthcare → "medical-office", "clinic", "healthcare", "hospital-lobby", "pharmacy"
- Food/restaurant → "food", "restaurant", "espresso", "cuisine", "kitchen"
- Fitness → "gym-equipment", "fitness-facility", "athletic-training", "sports-facility"
BANNED keywords: "fitness", "body", "workout", "gym", "muscle" — use safe alternatives above.`;

// ── Professional images fast-path ─────────────────────────────────────────────

const PROFESSIONAL_IMAGES_INTENT =
  /\b(professional|real|proper|relevant|contextual|high.?quality|stock)\s+(photos?|images?|pictures?)\b|\badd\s+(?:real|proper|professional|contextual|stock|relevant)\s+(?:photos?|images?)\b/i;

function resolveImageRequest(
  message: string,
  site: Record<string, any>,
  brief: string
): { events: Array<{ name: string; args: Record<string, any> }>; reply: string } | null {
  if (!PROFESSIONAL_IMAGES_INTENT.test(message)) return null;

  const brand: string = site?.brand?.name ?? '';
  const keywords = extractVisualKeywords(brief, brand);
  const images = buildProfessionalImageUrls(keywords, 6);

  return {
    events: [
      {
        name: 'patchSection',
        args: { section: 'gallery', patch: { displayType: 'photos', images } },
      },
    ],
    reply: `Added 6 professional ${keywords[0].replace(/-/g, ' ')} images to the gallery.`,
  };
}

// ── Page-add detection ────────────────────────────────────────────────────────

const ADD_PAGE_PATTERN =
  /\b(?:add|create|build|make|generate)\s+(?:a\s+)?(.+?)\s+page\b/i;

// Avoid false positives for "home", "landing", "main", or section names
const NOT_A_PAGE = /\b(home|landing|main|index|hero|cta|contact.?form|pricing.?table)\b/i;

function detectPageAdd(message: string): string | null {
  const m = message.match(ADD_PAGE_PATTERN);
  if (!m) return null;
  const name = m[1].trim();
  if (NOT_A_PAGE.test(name)) return null;
  // Filter very long matches (probably not a page name)
  if (name.split(/\s+/).length > 4) return null;
  return name;
}

// ── Page HTML editing ─────────────────────────────────────────────────────────

async function callClaudeForPageEdit(
  client: Anthropic,
  instruction: string,
  pageHtml: string,
  brief: string,
  pageName: string
): Promise<{ reply: string; html?: string }> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: `You are editing the "${pageName}" HTML page of a website.
Write a 1-2 sentence reply on the FIRST line (plain text only, no markdown).
Then on the NEXT line output the COMPLETE updated HTML document starting with <!DOCTYPE html>.

Example output format:
Updated the hero heading to "New Title" and adjusted the card spacing.
<!DOCTYPE html>
<html>
...
</html>

Rules:
- Make ONLY the requested change. Return the complete HTML with the change applied.
- NEVER truncate your reply mid-sentence. Finish every sentence completely.
- If the instruction is clear, execute it without asking for clarification. Explain what you did after.`,
    messages: [
      {
        role: 'user',
        content: `Brief: ${brief}\n\nCurrent "${pageName}" page HTML:\n${pageHtml}\n\nChange requested: ${instruction}`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
  const docStart = text.search(/<!DOCTYPE|<html/i);

  if (docStart > 0) {
    return {
      reply: text.slice(0, docStart).trim(),
      html: text.slice(docStart).trim(),
    };
  }

  return { reply: text };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function siteEffectivelyChanged(before: Record<string, any>, after: Record<string, any>): boolean {
  const strip = (s: Record<string, any>) => { const { blocks: _, ...rest } = s; return rest; };
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
            'The site JSON you returned is identical to the input — the change was not applied. You MUST modify the actual site JSON fields. Editable fields include: theme.palette (colors), hero.backgroundImage, hero.title/subtitle/cta, about/features/gallery/pricing/faq/cta sections.',
        },
        { role: 'assistant', content: '{' },
      ],
    });

    const retryText = retryMessage.content[0].type === 'text' ? retryMessage.content[0].text : '';
    try {
      const retryParsed = ChatResponseSchema.parse(JSON.parse('{' + retryText));
      if (retryParsed.site && siteEffectivelyChanged(site, retryParsed.site)) finalParsed = retryParsed;
    } catch { /* keep first */ }
  }

  const updatedSite = finalParsed.site ? sanitizeSiteImages(finalParsed.site) : undefined;
  return {
    reply: finalParsed.reply,
    siteEvent: updatedSite ? { name: 'setSiteData', args: updatedSite } : undefined,
  };
}

// ── Route handler ─────────────────────────────────────────────────────────────

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
    const activePage: string = typeof body?.activePage === 'string' ? body.activePage : 'home';
    const pageHtml: string | undefined = typeof body?.pageHtml === 'string' ? body.pageHtml : undefined;
    const incomingPages: Array<{ id: string; name: string }> = Array.isArray(body?.pages) ? body.pages : [];
    const lastUserMessage = [...messages].reverse().find((m: any) => m?.role === 'user')?.content || '';

    // ── Fast path 1: add a new page ────────────────────────────────────────
    const pageAddName = detectPageAdd(lastUserMessage);
    if (pageAddName) {
      const colors = site?.theme?.palette ?? {};
      const brandName = site?.brand?.name ?? '';
      const existingPages = [{ id: 'home', name: 'Home' }, ...incomingPages];

      const generated = await generatePage(client, {
        pageName: pageAddName,
        brief,
        designSystem: { colors, brandName },
        existingPages,
      });

      return Response.json({
        ok: true,
        reply: `Added a ${generated.pageName} page. Click the "${generated.pageName}" tab in the preview to see it.`,
        events: [{ name: 'addPage', args: generated }],
      });
    }

    // ── Fast path 2: editing a non-home page ───────────────────────────────
    if (activePage !== 'home' && pageHtml) {
      const pageName = incomingPages.find((p) => p.id === activePage)?.name ?? activePage;
      const result = await callClaudeForPageEdit(client, lastUserMessage, pageHtml, brief, pageName);
      return Response.json({
        ok: true,
        reply: result.reply || `Updated the ${pageName} page.`,
        events: result.html
          ? [{ name: 'updatePage', args: { id: activePage, html: result.html } }]
          : [],
      });
    }

    // ── Standard home-page editing ─────────────────────────────────────────
    const imageResult = resolveImageRequest(lastUserMessage, site, brief);
    if (imageResult) {
      return Response.json({ ok: true, reply: imageResult.reply, events: imageResult.events });
    }

    const ops = collectAllOps(lastUserMessage, site);
    const allEvents: Array<{ name: string; args: Record<string, any> }> = [];
    const allReplies: string[] = [];

    if (ops.nonTemplateInstruction) {
      const claude = await callClaude(client, ops.nonTemplateInstruction, site, brief);
      allReplies.push(claude.reply);
      if (claude.siteEvent) allEvents.push(claude.siteEvent);
    }

    allEvents.push(...ops.events);
    allReplies.push(...ops.replies);

    if (allReplies.length === 0 && allEvents.length === 0) {
      return Response.json({ ok: true, reply: "I didn't find anything to change.", events: [] });
    }

    return Response.json({ ok: true, reply: allReplies.filter(Boolean).join(' '), events: allEvents });
  } catch (err: any) {
    return Response.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
