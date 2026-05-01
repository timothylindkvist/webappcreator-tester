import Anthropic from '@anthropic-ai/sdk';
import { rateLimit } from '@/lib/ratelimit';
import { MODEL } from '@/lib/models';
import { sanitizeSiteImages } from '@/lib/imageKeywords';
import { patternForBusiness, VALID_PATTERNS } from '@/lib/heroPatterns';
import type { PatternId } from '@/lib/heroPatterns';
import { NextRequest } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const PaletteSchema = z.object({
  brand: z.string(),
  accent: z.string(),
  background: z.string(),
  foreground: z.string(),
});

const BuildSchema = z.object({
  theme: z.object({
    palette: PaletteSchema,
    density: z.enum(['compact', 'cozy', 'comfortable']).optional(),
    vibe: z.string().optional(),
  }),
  brand: z.object({
    name: z.string().default(''),
    tagline: z.string().default(''),
    industry: z.string().optional(),
  }).default({ name: '', tagline: '' }),
  hero: z.object({
    title: z.string(),
    subtitle: z.string(),
    cta: z.object({ label: z.string(), href: z.string().optional() }).optional(),
    metrics: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
    backgroundImage: z.string().optional(),
    pattern: z.string().optional(),
  }),
  about: z.object({
    heading: z.string().optional(),
    body: z.string().optional(),
    bullets: z.array(z.string()).optional(),
  }).optional(),
  features: z.object({
    title: z.string().optional(),
    items: z.array(z.object({ title: z.string(), body: z.string().optional(), description: z.string().optional() })).optional(),
  }).optional(),
  pricing: z.object({
    title: z.string().optional(),
    plans: z.array(z.object({ name: z.string(), price: z.string().optional(), features: z.array(z.string()).optional() })).optional(),
  }).optional(),
  faq: z.object({
    title: z.string().optional(),
    items: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
  }).optional(),
  cta: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    button: z.object({ label: z.string(), href: z.string().optional() }).optional(),
  }).optional(),
  gallery: z.object({
    title: z.string().optional(),
    displayType: z.enum(['photos', 'icon-cards', 'feature-cards', 'color-blocks', 'screenshot-mockups']).optional(),
    images: z.array(z.object({ src: z.string(), caption: z.string().optional(), alt: z.string().optional() })).optional(),
    items: z.array(z.record(z.unknown())).optional(),
  }).optional(),
}).passthrough();

// Claude sometimes returns flat arrays or flattened theme — normalize before validating.
function normalize(raw: Record<string, any>): Record<string, any> {
  const out = { ...raw };

  // theme: { brand, accent, ... } -> theme: { palette: { brand, accent, ... } }
  if (out.theme && typeof out.theme === 'object' && !out.theme.palette) {
    const { vibe, density, typography, background: bg, ...colors } = out.theme;
    // if the theme has color keys at top level, wrap them in palette
    if (colors.brand || colors.accent) {
      out.theme = { palette: { brand: colors.brand, accent: colors.accent, background: colors.background ?? bg ?? '#09090b', foreground: colors.foreground ?? '#fafafa' }, vibe, density, typography };
    }
  }

  // features: [...] -> features: { items: [...] }
  if (Array.isArray(out.features)) out.features = { items: out.features };

  // faq: [...] -> faq: { items: [...] }
  if (Array.isArray(out.faq)) out.faq = { items: out.faq };

  // testimonials: [...] -> testimonials: { items: [...] }
  if (Array.isArray(out.testimonials)) out.testimonials = { items: out.testimonials };

  // pricing: [...] -> pricing: { plans: [...] }
  if (Array.isArray(out.pricing)) out.pricing = { plans: out.pricing };

  // gallery: [...] -> gallery: { images: [...] }
  if (Array.isArray(out.gallery)) out.gallery = { images: out.gallery };

  return out;
}

function inferBlocks(site: z.infer<typeof BuildSchema> & Record<string, any>) {
  const order = ['hero', 'about', 'features', 'gallery', 'testimonials', 'pricing', 'faq', 'cta', 'game', 'history', 'html'];
  return order
    .filter((key) => site[key] != null)
    .map((key) => ({ id: key, type: key, data: site[key] }));
}

export async function POST(req: NextRequest) {
  const ip = (req.headers.get('x-forwarded-for') || 'anon').split(',')[0];
  const rl = rateLimit(`build:${ip}`, 30, 60);
  if (!rl.ok) {
    return new Response(JSON.stringify({ error: 'rate_limited', reset: rl.reset }), { status: 429 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ ok: false, error: 'Missing ANTHROPIC_API_KEY' }, { status: 401 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const { brief } = await req.json();
    if (!brief || typeof brief !== 'string') {
      return Response.json({ ok: false, error: 'Missing or invalid brief' }, { status: 400 });
    }

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: `You are a product designer generating website JSON. Return ONLY valid JSON — no markdown, no code fences, no explanation.

Use exactly this structure:
{
  "theme": { "palette": { "brand": "#hex", "accent": "#hex", "background": "#hex", "foreground": "#hex" }, "vibe": "string", "density": "compact|cozy|comfortable" },
  "brand": { "name": "string", "tagline": "string" },
  "hero": { "title": "string", "subtitle": "string", "cta": { "label": "string" }, "pattern": "dark-grid" },
  "about": { "heading": "string", "body": "string", "bullets": ["string"] },
  "features": { "title": "string", "items": [{ "title": "string", "description": "string" }] },
  "gallery": { "title": "string", "displayType": "photos|icon-cards|feature-cards|color-blocks|screenshot-mockups", "images": [{ "src": "https://source.unsplash.com/800x600/?keyword1,keyword2&sig=N", "caption": "string", "alt": "string" }], "items": [] },
  "pricing": { "title": "string", "plans": [{ "name": "string", "price": "string", "features": ["string"] }] },
  "faq": { "title": "string", "items": [{ "q": "string", "a": "string" }] },
  "cta": { "title": "string", "subtitle": "string", "button": { "label": "string" } }
}

EMOTIONAL REGISTER — read the brief carefully and match the tone and palette to the human context:

SENSITIVE topics (death, grief, wills, estate planning, bereavement, end-of-life, serious illness, disability, mental health, crisis, divorce, elder care):
- Palette: calm, muted, trustworthy. Brand = deep navy (#1e3a5f), forest green (#2d5a3d), or warm slate (#3d4f6b). Background = warm off-white (#faf8f5) or very dark (#0f1419). Accent = soft gold (#c9a84c) or muted teal (#4a8fa8). NO neon, NO bright purple, NO high-saturation colors.
- Density: "comfortable" (generous spacing feels respectful and unhurried)
- Copy: dignified, calm, reassuring. Lead with empathy and clarity, not urgency. Short sentences.
- CTA labels: "Begin when you're ready", "Get started at your own pace", "Learn more", "See how it works" — NOT "Start now!", "Get it free!", "Sign up today!"
- NO exclamation marks anywhere. NO words like "revolutionary", "game-changing", "powerful", "instant".
- Hero subtitle should acknowledge the emotional weight, then offer relief: "Planning ahead is an act of care for the people you love."
- Features section: focus on peace of mind, security, simplicity, legal certainty
- FAQ: address real fears honestly (Is it legally binding? What if my situation is complex?)
- Testimonials if included: focus on relief and clarity, not excitement

PROFESSIONAL topics (B2B software, legal services, finance, insurance, healthcare, consulting):
- Palette: authoritative and credible. Deep blues, dark greys, clean whites. Accent = moderate brand color.
- Copy: clear, credible, benefit-focused without hype
- Density: "cozy"

ENERGETIC topics (consumer SaaS, startups, fitness, food, events, lifestyle, entertainment):
- Palette: vibrant, distinctive. Express the brand personality boldly.
- Copy: punchy, direct, conversion-focused. Exclamation marks are fine.
- Density: "compact" or "cozy"

CREATIVE topics (portfolios, agencies, design, art, music, fashion):
- Palette: expressive, unique. Break conventions deliberately.
- Copy: personality-first, distinctive voice.
- Density: any that fits

Keep copy concise and realistic. Match section selection to what the audience actually needs — a grief-adjacent service does not need an aggressive CTA section, it needs trust signals and a gentle FAQ.

HERO PATTERN — set hero.pattern to one of these four values based on the business type:
- "dark-grid": subtle white grid on very dark background with a brand-color radial glow. Best for: gym/fitness, food, events, lifestyle, general consumer, retail
- "dot-matrix": small repeating dots on very dark background with glow. Best for: photography, film, music, media, podcasts, studios
- "gradient-mesh": smooth multi-color gradient blobs on dark background (brand + accent colors). Best for: tech/SaaS, startups, creative agencies, design studios, AI products
- "light-minimal": clean white/off-white with subtle grey grid lines. Best for: law firms, accountants, finance, insurance, medical, healthcare, grief/bereavement, estate planning, any professional or sensitive service

GALLERY DISPLAY TYPE — set gallery.displayType based on the business:
- "photos": default — real businesses where photos of the product/service/place matter most (restaurant, retail, photography, real estate, coffee shop, events). Use images[] with LoremFlickr URLs.
- "icon-cards": when the product/service is abstract and icons communicate features better (apps, platforms, SaaS features, services list). Use items[]: [{ "icon": "emoji", "title": "string", "description": "string", "color": "#hex" }]
- "feature-cards": SaaS, data-driven businesses, or when stats/numbers tell the story. Use items[]: [{ "stat": "10x", "title": "Faster workflow", "subtitle": "Compared to manual processes" }]
- "color-blocks": creative agencies, design studios, art brands, fashion — purely decorative colorful grid. Use items[]: [{ "gradient": "linear-gradient(135deg, #color1, #color2)", "title": "string" }]
- "screenshot-mockups": software products, apps, SaaS tools where showing the interface matters. Use items[]: [{ "title": "Dashboard view", "accentColor": "#hex", "url": "app.example.com" }]

For "photos" displayType, use images[] with Unsplash Source URLs:
https://source.unsplash.com/800x600/?keyword1,keyword2&sig=N (different N per image, start at 1)
Keywords MUST match the actual business:
- pizza restaurant → "pizza,restaurant&sig=1", "pasta,kitchen&sig=2", "italian,food&sig=3", "cuisine,dining&sig=4"
- yoga studio → "yoga-class,wellness&sig=1", "meditation,studio&sig=2", "pilates,class&sig=3"
- gym/fitness → "gym-equipment,weights&sig=1", "fitness-facility,training&sig=2", "athletic-training,sports&sig=3"
- coffee shop → "espresso,coffee&sig=1", "latte,cafe&sig=2", "coffee,interior&sig=3"
BANNED keywords: "fitness", "body", "workout", "gym", "muscle", "exercise" — use safe alternatives above.`,
      messages: [
        { role: 'user', content: brief },
        { role: 'assistant', content: '{' },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const raw = normalize(JSON.parse('{' + responseText));
    const parsed = BuildSchema.parse(raw);

    // Use AI's pattern choice if valid, otherwise infer from the brief
    const pattern: PatternId = VALID_PATTERNS.has(parsed.hero?.pattern ?? '')
      ? (parsed.hero!.pattern as PatternId)
      : patternForBusiness(brief);

    const data = sanitizeSiteImages({
      ...parsed,
      hero: { ...parsed.hero, pattern, backgroundImage: '' },
      media: { hero: { url: '' } },
    });

    return Response.json({ ok: true, data: { ...data, blocks: inferBlocks(data) } });
  } catch (err: any) {
    return Response.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
