import Anthropic from '@anthropic-ai/sdk';
import { rateLimit } from '@/lib/ratelimit';
import { MODEL } from '@/lib/models';
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
  "hero": { "title": "string", "subtitle": "string", "cta": { "label": "string" }, "backgroundImage": "https://loremflickr.com/1600/900/keyword1,keyword2" },
  "about": { "heading": "string", "body": "string", "bullets": ["string"] },
  "features": { "title": "string", "items": [{ "title": "string", "description": "string" }] },
  "gallery": { "title": "string", "images": [{ "src": "https://loremflickr.com/800/600/keyword1,keyword2?lock=N", "caption": "string", "alt": "string" }] },
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

IMAGES — always include both of these:
1. hero.backgroundImage: a LoremFlickr URL using keywords extracted directly from the brief. Format: https://loremflickr.com/1600/900/keyword1,keyword2
2. gallery section with 3–6 images. Each image: https://loremflickr.com/800/600/keyword1,keyword2?lock=N where N is a different integer (1, 2, 3…) per image to get variety.

CRITICAL — keywords MUST reflect the actual business described. Extract concrete nouns from the brief:
- "wood-fired pizza restaurant" → hero: "pizza,restaurant" | gallery: "pizza?lock=1", "restaurant,interior?lock=2", "pasta,food?lock=3", "italian,cuisine?lock=4"
- "yoga studio" → hero: "yoga,meditation" | gallery: "yoga?lock=1", "yoga,pose?lock=2", "meditation?lock=3", "wellness?lock=4"
- "wedding photography" → hero: "wedding,photography" | gallery: "wedding?lock=1", "bride?lock=2", "wedding,ceremony?lock=3", "couple,portrait?lock=4"
- "law firm" → hero: "lawyer,office" | gallery: "legal,office?lock=1", "lawyer?lock=2", "business,meeting?lock=3", "legal,documents?lock=4"
- "gym/fitness" → hero: "gym,fitness" | gallery: "weightlifting?lock=1", "gym,workout?lock=2", "fitness,training?lock=3", "exercise?lock=4"
- "coffee shop" → hero: "coffee,cafe" | gallery: "espresso?lock=1", "latte,coffee?lock=2", "cafe,interior?lock=3", "coffee,beans?lock=4"
- "tech startup" → hero: "technology,startup" | gallery: "coding,laptop?lock=1", "team,meeting?lock=2", "startup,office?lock=3", "software?lock=4"
- "hair salon" → hero: "hair,salon" | gallery: "haircut?lock=1", "hair,color?lock=2", "salon,styling?lock=3", "beauty?lock=4"

Rules for keywords:
- Use 1-2 concrete nouns per URL (LoremFlickr searches Flickr by tag — short, common terms work best)
- Hero keywords must match the core business identity — NEVER use "city", "street", "transportation", "architecture" unless the business is about those
- Each gallery image must use different ?lock=N values so they show different photos
- For sensitive topics (grief, legal, healthcare): use "office", "consultation", "family", "documents" — not abstract scenes

Gallery captions should describe what the image represents for the business, not just generic labels.`,
      messages: [
        { role: 'user', content: brief },
        { role: 'assistant', content: '{' },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const raw = normalize(JSON.parse('{' + responseText));
    const parsed = BuildSchema.parse(raw);

    const heroImage = parsed.hero?.backgroundImage || '';
    const data = {
      ...parsed,
      media: { hero: { url: heroImage } },
      hero: { ...parsed.hero, backgroundImage: heroImage },
    };

    return Response.json({ ok: true, data: { ...data, blocks: inferBlocks(data) } });
  } catch (err: any) {
    return Response.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
