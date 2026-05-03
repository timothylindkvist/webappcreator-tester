import Anthropic from '@anthropic-ai/sdk';
import { rateLimit } from '@/lib/ratelimit';
import { MODEL } from '@/lib/models';
import { sanitizeSiteImages, extractVisualKeywords, buildProfessionalImageUrls } from '@/lib/imageKeywords';
import { collectAllOps } from '@/lib/sectionTemplates';
import { generatePage } from '@/lib/pageGenerator';
import { restoreNavEmbed } from '@/lib/navIntercept';
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
Words like "real", "better", "proper", "fix", or "improve" in reference to a specific element only apply to that element — never an invitation to redesign other sections or remove content the user has already built.

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

function buildImageBlocks(screenshot?: string): Array<Record<string, unknown>> {
  if (!screenshot) return [];
  const match = screenshot.match(/^data:(image\/[^;]+);base64,/);
  const mediaType = (match?.[1] ?? 'image/jpeg') as string;
  const data = match ? screenshot.slice(match[0].length) : screenshot;
  return [
    { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
    { type: 'text', text: 'Screenshot: The current page the user is editing.' },
  ];
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

  // Step 3: log content array structure before sending to Claude
  if (Array.isArray(userContent)) {
    console.log('[callClaudeForPageEdit] Step 3 ✓  content blocks:');
    userContent.forEach((b: any, i: number) => {
      if (b.type === 'image') {
        console.log(`  [${i}] { "type": "image", "source": { "type": "${b.source?.type}", "media_type": "${b.source?.media_type}", "data": "${String(b.source?.data ?? '').slice(0, 40)}..." } }`);
      } else {
        console.log(`  [${i}] { "type": "text", "text": "${String(b.text ?? '').slice(0, 60)}..." }`);
      }
    });
  } else {
    console.log('[callClaudeForPageEdit] Step 3 — text-only (no image blocks)');
  }

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
- PRESERVE the <script id="sm-nav-cfg" type="application/json"> tag and inline nav script EXACTLY as-is — do not remove, move, or modify them.
- The HTML provided IS the ${pageName} page. Edit this exact document; do not substitute or regenerate it from scratch based on assumptions.

SURGICAL EDITS — non-negotiable:
- Words like "real", "better", "proper", "fix", or "improve" in reference to a specific element ONLY apply to that element. They are NEVER permission to redesign, restructure, or remove anything else on the page.
- Before writing your output, identify the single element(s) the user named. Change only those. Every other section, heading, paragraph, image, card, button, and script must appear in the output unchanged.
- If the instruction is "fix the download buttons" → touch only the download button elements. If it is "make the icons real" → swap only the icon elements. Nothing else moves.
- Before returning the HTML, verify: every visible section, heading, paragraph, and interactive element from the original is still present. If anything is missing that the user did not explicitly ask to remove, you have made an error — add it back.

BRAND ASSETS — when the user asks for "real", "official", or "proper" icons, logos, or badges for any known platform or brand:
Always use the actual official brand asset — never a hand-drawn substitute, generic icon, emoji, or thematically-related placeholder.
Official sources:
- Apple App Store badge: <a href="#"><img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="Download on the App Store" style="height:40px"></a>
- Google Play badge: <a href="#"><img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" style="height:60px"></a>
- Any other platform icon (Spotify, LinkedIn, Instagram, X/Twitter, Facebook, YouTube, TikTok, GitHub, Discord, Slack, WhatsApp, etc.): use Simple Icons CDN → <img src="https://cdn.simpleicons.org/{slug}" width="28" height="28" alt="{name}"> where {slug} is the official Simple Icons slug (all lowercase, no spaces: spotify, linkedin, instagram, x, facebook, youtube, tiktok, github, discord, slack, whatsapp, snapchat, pinterest, appstore, googleplay).
- Apply the platform's official brand color to the icon using a CSS color filter, or wrap it in a container styled with that color.
Only replace the specific icon/badge elements that were mentioned. Leave all surrounding content untouched.

ADDITIVE CHANGES — when the instruction is to add, insert, include, append, or put something new:
- The existing HTML is SACRED. Every element, attribute, text node, and style already present must appear unchanged in your output.
- Locate the single best insertion point and place the new element there. Touch NOTHING else.
- Do not simplify, rewrite, restructure, or remove any existing section as a side-effect.
- If in doubt about where to insert, add at the end of <body> before </body>.
- Verify before returning: every visible heading, paragraph, and section from the original is still present.

INTERACTIVE CONTENT EXPANSION — non-negotiable rules:
When the user asks for "read more", "view details", "learn more", "see full info", "expand", "modal", "drawer", or any variation meaning "show more content about an element", you MUST:
1. Implement the COMPLETE interaction end-to-end — not just add a button. Every trigger element (button, link, card) must have a real working click event listener attached (use DOMContentLoaded or inline onclick).
2. Create the TARGET content — the modal overlay, expanded section, or drawer — with REAL content from the page (not placeholder text). Fill it with the actual details of the item being expanded.
3. Implement both OPEN and CLOSE: clicking the trigger opens it; clicking a close button, pressing Escape, or clicking the overlay backdrop closes it.
4. Use a fixed-position overlay modal pattern for substantial content. Example pattern:
   <div id="modal-X" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9000;align-items:center;justify-content:center">
     <div style="background:#fff;border-radius:12px;padding:2rem;max-width:560px;width:90%;max-height:80vh;overflow-y:auto;position:relative">
       <button onclick="document.getElementById('modal-X').style.display='none'" style="position:absolute;top:1rem;right:1rem;...">×</button>
       <!-- real content here -->
     </div>
   </div>
   <script>
   document.addEventListener('DOMContentLoaded',function(){
     document.querySelectorAll('[data-open-modal="X"]').forEach(function(btn){
       btn.addEventListener('click',function(){
         document.getElementById('modal-X').style.display='flex';
       });
     });
     document.querySelectorAll('.sm-modal-backdrop').forEach(function(el){
       el.addEventListener('click',function(e){if(e.target===this)this.style.display='none';});
     });
   });
   </script>
5. NEVER mark a feature complete by adding a button that does nothing or links to "#". If a button click does nothing, you have not finished the task.`,
    messages: [
      {
        role: 'user',
        content: userContent,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
  const docStart = text.search(/<!DOCTYPE|<html/i);

  if (docStart >= 0) {
    return {
      reply: docStart > 0 ? text.slice(0, docStart).trim() : `Updated the ${pageName} page.`,
      html: text.slice(docStart).trim(),
    };
  }

  return { reply: text };
}

// ── Additive (fragment-only) page editing ────────────────────────────────────

const ADDITIVE_PATTERN = /\b(add|insert|include|append|put|place)\b/i;

async function callClaudeForPageFragment(
  client: Anthropic,
  instruction: string,
  pageHtml: string,
  brief: string,
  pageName: string
): Promise<{ reply: string; fragment?: string }> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: `You are adding a new element to the "${pageName}" page of a website.

Line 1: one sentence confirming what you added (plain text only, no markdown).
Lines 2+: ONLY the new HTML element(s) to insert — raw HTML, no code fences, no full page, no existing content.

Rules:
- Do NOT reproduce the existing page. Output only the new fragment.
- The fragment will be automatically injected before </body>.
- Match the visual style of the existing page (colours, fonts, card design, spacing).
- Use inline style attributes or a self-contained <style> block — no external stylesheet references.
- Words like "real", "proper", or "official" for a specific element mean use the actual brand asset for that element only — never restructure anything else.

BRAND ASSETS — when adding icons, logos, or badges for any known platform:
Always use the actual official brand asset:
- Apple App Store badge: <a href="#"><img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="Download on the App Store" style="height:40px"></a>
- Google Play badge: <a href="#"><img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" style="height:60px"></a>
- Any other platform icon (Spotify, LinkedIn, Instagram, X/Twitter, Facebook, YouTube, TikTok, GitHub, Discord, etc.): <img src="https://cdn.simpleicons.org/{slug}" width="28" height="28" alt="{name}"> where {slug} is the lowercase Simple Icons slug.`,
    messages: [
      {
        role: 'user',
        content: `Brief: ${brief}\n\nExisting "${pageName}" page HTML (read for style context — do NOT reproduce):\n${pageHtml}\n\nAdd the following: ${instruction}`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
  const fragStart = text.search(/<[a-zA-Z]/);
  if (fragStart >= 0) {
    return {
      reply: fragStart > 0 ? text.slice(0, fragStart).trim() : `Added to the ${pageName} page.`,
      fragment: text.slice(fragStart).trim(),
    };
  }
  return { reply: text };
}

function injectFragment(html: string, fragment: string): string {
  return html.includes('</body>')
    ? html.replace(/<\/body>/i, `${fragment}\n</body>`)
    : html + '\n' + fragment;
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

  // Step 3: log content array structure before sending to Claude
  if (Array.isArray(userContent)) {
    console.log('[callClaude] Step 3 ✓  content blocks:');
    userContent.forEach((b: any, i: number) => {
      if (b.type === 'image') {
        console.log(`  [${i}] { "type": "image", "source": { "type": "${b.source?.type}", "media_type": "${b.source?.media_type}", "data": "${String(b.source?.data ?? '').slice(0, 40)}..." } }`);
      } else {
        console.log(`  [${i}] { "type": "text", "text": "${String(b.text ?? '').slice(0, 60)}..." }`);
      }
    });
  } else {
    console.log('[callClaude] Step 3 — text-only (no image blocks)');
  }

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
    const referencedPageName: string | undefined = typeof body?.referencedPageName === 'string' ? body.referencedPageName : undefined;
    const referencedPageHtml: string | undefined = typeof body?.referencedPageHtml === 'string' ? body.referencedPageHtml : undefined;
    const lastUserMessage = [...messages].reverse().find((m: any) => m?.role === 'user')?.content || '';

    const allPagesHtml: Array<{ id: string; name: string; html: string }> | undefined =
      Array.isArray(body?.allPagesHtml) ? body.allPagesHtml : undefined;

    const imageBlocks = buildImageBlocks(screenshot);

    // ── Fast path 0: site-wide change (all pages) ──────────────────────────
    if (allPagesHtml && allPagesHtml.length > 0) {
      const isAdditiveSiteWide = ADDITIVE_PATTERN.test(lastUserMessage);

      const [homeResult, ...pageResults] = await Promise.all([
        callClaude(client, lastUserMessage, site, brief, imageBlocks.length ? imageBlocks : undefined),
        ...allPagesHtml.map((p) =>
          isAdditiveSiteWide
            ? callClaudeForPageFragment(client, lastUserMessage, p.html, brief, p.name)
                .then((r) => ({ ...r, id: p.id, originalHtml: p.html, name: p.name, isFragment: true as const }))
            : callClaudeForPageEdit(client, lastUserMessage, p.html, brief, p.name)
                .then((r) => ({ ...r, id: p.id, originalHtml: p.html, name: p.name, isFragment: false as const }))
        ),
      ]);

      const events: Array<{ name: string; args: Record<string, any> }> = [];
      if (homeResult.siteEvent) events.push(homeResult.siteEvent);
      for (const pr of pageResults) {
        if (pr.isFragment && pr.fragment) {
          const newHtml = restoreNavEmbed(injectFragment(pr.originalHtml, pr.fragment), pr.originalHtml);
          events.push({ name: 'updatePage', args: { id: pr.id, html: newHtml } });
        } else if (!pr.isFragment && pr.html) {
          const safeHtml = restoreNavEmbed(pr.html, pr.originalHtml);
          events.push({ name: 'updatePage', args: { id: pr.id, html: safeHtml } });
        }
      }

      const updatedPageNames = [
        ...(homeResult.siteEvent ? ['Home'] : []),
        ...pageResults.filter((r) => r.isFragment ? r.fragment : r.html).map((r) => r.name),
      ];
      const listStr = updatedPageNames.length > 0
        ? `Updated: ${updatedPageNames.join(', ')}.`
        : "Applied the change across all pages.";

      return Response.json({ ok: true, reply: listStr, events });
    }

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

      if (ADDITIVE_PATTERN.test(lastUserMessage)) {
        const fragResult = await callClaudeForPageFragment(client, lastUserMessage, pageHtml, brief, pageName);
        if (fragResult.fragment) {
          const newHtml = restoreNavEmbed(injectFragment(pageHtml, fragResult.fragment), pageHtml);
          return Response.json({
            ok: true,
            reply: fragResult.reply || `Added to the ${pageName} page.`,
            events: [{ name: 'updatePage', args: { id: activePage, html: newHtml } }],
          });
        }
        // Fragment extraction failed — fall through to full edit
      }

      const result = await callClaudeForPageEdit(client, lastUserMessage, pageHtml, brief, pageName, imageBlocks.length ? imageBlocks : undefined, referencedPageHtml, referencedPageName);
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
