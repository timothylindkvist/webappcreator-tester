import Anthropic from '@anthropic-ai/sdk';
import { rateLimit } from '@/lib/ratelimit';
import { MODEL } from '@/lib/models';
import { sanitizeSiteImages, extractVisualKeywords, buildProfessionalImageUrls } from '@/lib/imageKeywords';
import { collectAllOps } from '@/lib/sectionTemplates';
import { generatePage } from '@/lib/pageGenerator';
import { restoreNavEmbed } from '@/lib/navIntercept';
import { screenshotHtmlServer } from '@/lib/server-screenshot';
import { NextRequest } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const VISUAL_CONSISTENCY_RE =
  /\b(match(es)?|look(s)?\s+like|same\s+(theme|style|design|look|color|colour)|similar\s+to|consistent\s+with|make\s+it\s+like|apply\s+the\s+same)\b/i;

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

SCREENSHOTS — when screenshots are provided: Screenshot 1 is the page being edited; Screenshot 2 (if present) is the reference page the user wants to match. Use both images to understand the visual differences and apply the correct styles accurately.

REFERENCE PAGE HTML — when a reference page HTML is provided alongside a "make consistent" or "match" request, extract these from the reference page and apply them to the site JSON: (1) color values used in backgrounds, text, and borders → update theme.palette; (2) card/section styles (border-radius, shadows, padding patterns) → match via gallery.displayType and section data; (3) typographic hierarchy (heading sizes, weights) → reflect in content emphasis; (4) section presence/order → add missing sections or reorder blocks. Layout that is structurally fixed in React components cannot be changed, but colors, spacing feel, and content organisation can always be aligned.

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

// ── Vision image blocks ───────────────────────────────────────────────────────

// Accepts either a raw base64 string (Puppeteer) or a data URL (html2canvas).
// Derives the media type from the prefix so PNG fallbacks are handled correctly.
function toImageBlock(raw: string, label: string): [Record<string, unknown>, Record<string, unknown>] {
  const match = raw.match(/^data:(image\/[^;]+);base64,/);
  const mediaType = (match?.[1] ?? 'image/jpeg') as string;
  const data = match ? raw.slice(match[0].length) : raw;
  return [
    { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
    { type: 'text', text: label },
  ];
}

function buildImageBlocks(
  screenshot?: string,
  referencedScreenshot?: string,
  referencedPageName?: string
): Array<Record<string, unknown>> {
  const blocks: Array<Record<string, unknown>> = [];
  if (screenshot) {
    blocks.push(...toImageBlock(screenshot, 'Screenshot 1: The current page the user is editing.'));
  }
  if (referencedScreenshot && referencedPageName) {
    blocks.push(...toImageBlock(
      referencedScreenshot,
      `Screenshot 2: The ${referencedPageName} page that the user wants to reference or match.`
    ));
  }
  console.log(`[imageBlocks] built ${blocks.filter(b => b.type === 'image').length} image block(s)` +
    (screenshot ? ' [current]' : '') +
    (referencedScreenshot && referencedPageName ? ` [ref:${referencedPageName}]` : ''));
  return blocks;
}

// Removes <script> tags from HTML before sending as reference context.
function stripScripts(html: string): string {
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
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
  pageName: string,
  imageBlocks?: Array<Record<string, unknown>>,
  referencedPageHtml?: string,
  referencedPageName?: string
): Promise<{ reply: string; html?: string }> {
  const refBlock = referencedPageHtml
    ? `\n\nReference page ("${referencedPageName || 'reference'}" page) HTML — use its colors, card styles, and layout patterns:\n${stripScripts(referencedPageHtml)}`
    : '';
  const textContent = `Brief: ${brief}\n\nCurrent "${pageName}" page HTML:\n${pageHtml}${refBlock}\n\nChange requested: ${instruction}`;
  const userContent: any = imageBlocks?.length
    ? [...imageBlocks, { type: 'text', text: textContent }]
    : textContent;

  console.log(`[callClaudeForPageEdit] payload blocks: ${
    Array.isArray(userContent)
      ? userContent.map((b: any) => b.type).join(', ')
      : 'text-only'
  }`);

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
- If the instruction is clear, execute it without asking for clarification. Explain what you did after.
- When screenshots are provided, Screenshot 1 is the current page and Screenshot 2 (if present) is the reference page to match.
- PRESERVE the <script id="sm-nav-cfg" type="application/json"> tag and <script src="/nav.js"> tag EXACTLY as-is — do not remove, move, or modify them.`,
    messages: [
      {
        role: 'user',
        content: userContent,
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
  brief: string,
  imageBlocks?: Array<Record<string, unknown>>,
  referencedPageHtml?: string,
  referencedPageName?: string
): Promise<{ reply: string; siteEvent?: { name: string; args: Record<string, any> } }> {
  const refBlock = referencedPageHtml
    ? `\n\nReference page ("${referencedPageName || 'reference'}" page) HTML — extract its color palette, card styles, typography weights, and section structure to apply to the site JSON:\n${stripScripts(referencedPageHtml)}`
    : '';
  const textContent = `Brief: ${brief}\n\nCurrent site:\n${JSON.stringify(site, null, 2)}${refBlock}\n\nChange requested: ${instruction}`;
  const userContent: any = imageBlocks?.length
    ? [...imageBlocks, { type: 'text', text: textContent }]
    : textContent;

  console.log(`[callClaude] payload blocks: ${
    Array.isArray(userContent)
      ? userContent.map((b: any) => b.type).join(', ')
      : 'text-only'
  }`);

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
    const screenshot: string | undefined = typeof body?.screenshot === 'string' ? body.screenshot : undefined;
    const referencedScreenshot: string | undefined = typeof body?.referencedScreenshot === 'string' ? body.referencedScreenshot : undefined;
    const referencedPageName: string | undefined = typeof body?.referencedPageName === 'string' ? body.referencedPageName : undefined;
    const referencedPageHtml: string | undefined = typeof body?.referencedPageHtml === 'string' ? body.referencedPageHtml : undefined;
    const lastUserMessage = [...messages].reverse().find((m: any) => m?.role === 'user')?.content || '';

    // For visual consistency requests, screenshot the reference page server-side at
    // 1280×800 via Puppeteer instead of relying on the client's html2canvas capture.
    let effectiveReferencedScreenshot = referencedScreenshot;
    if (referencedPageHtml && VISUAL_CONSISTENCY_RE.test(lastUserMessage)) {
      console.log('[chat/route] Visual consistency detected — taking server-side Puppeteer screenshot');
      const serverShot = await screenshotHtmlServer(referencedPageHtml);
      if (serverShot) {
        console.log(`[chat/route] Puppeteer screenshot OK (${serverShot.length} base64 chars)`);
        effectiveReferencedScreenshot = serverShot;
      } else {
        console.log('[chat/route] Puppeteer screenshot failed — falling back to client screenshot');
      }
    }

    const imageBlocks = buildImageBlocks(screenshot, effectiveReferencedScreenshot, referencedPageName);

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
        events: [{ name: 'addPage', args: { id: generated.pageId, name: generated.pageName, html: generated.html } }],
      });
    }

    // ── Fast path 2: editing a non-home page ───────────────────────────────
    if (activePage !== 'home' && pageHtml) {
      const pageName = incomingPages.find((p) => p.id === activePage)?.name ?? activePage;
      const result = await callClaudeForPageEdit(client, lastUserMessage, pageHtml, brief, pageName, imageBlocks.length ? imageBlocks : undefined, referencedPageHtml, referencedPageName);
      // Restore nav embed if Claude accidentally stripped it
      const safeHtml = result.html ? restoreNavEmbed(result.html, pageHtml) : undefined;
      return Response.json({
        ok: true,
        reply: result.reply || `Updated the ${pageName} page.`,
        events: safeHtml
          ? [{ name: 'updatePage', args: { id: activePage, html: safeHtml } }]
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
      const claude = await callClaude(client, ops.nonTemplateInstruction, site, brief, imageBlocks.length ? imageBlocks : undefined, referencedPageHtml, referencedPageName);
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
