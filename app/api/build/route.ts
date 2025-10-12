import OpenAI from 'openai';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || process.env.NEXT_PUBLIC_AI_MODEL || 'gpt-5-mini';

const SCHEMA = String.raw`
Return ONE JSON object only (no markdown) with this TypeScript shape:
type Theme = {
  vibe?: string;
  palette: { brand: string; accent: string; background: string; foreground: string
  background: { style: 'mesh' | 'radial-glow' | 'shapes' | 'energy' | 'gradient-scene'; palette: string[]; intensity: 'soft' | 'balanced' | 'vivid'; blendMode?: 'screen' | 'overlay' | 'lighten' | 'normal'; particleField?: boolean };};
  typography?: { body?: string; headings?: string };
  density?: 'compact' | 'cozy' | 'comfortable';
};
type SiteData = {
  media?: { hero?: { url: string } };
theme: Theme;
  brand: { name: string; tagline: string; industry?: string };
  hero: { title: string; subtitle: string; cta?: { label: string; href?: string } };
  about?: { heading?: string; body?: string };
  features?: { title?: string; items?: { title: string; body: string }[] };
  services?: { title?: string; items?: { title: string; body: string }[] };
  pricing?: { plans: { name: string; price: string; features: string[] }[] };
  testimonials?: { title?: string; items?: { quote: string; author?: string }[] };
  gallery?: { title?: string; images: { src: string; caption?: string; alt?: string }[] };
  contact?: { email?: string; phone?: string; address?: string, cta?: string };
};
`;

function extractJSON(text: string) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try { return JSON.parse(text.slice(start, end + 1)); } catch { return null; }
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ ok: false, error: 'Missing OPENAI_API_KEY' }, { status: 401 });
    }
    const { brief = '' } = await req.json();

    const sys = `${SCHEMA}
You generate an initial website JSON.
You must ALWAYS include a theme.background object with:
// --- BACKGROUND DESIGN GUIDELINES ---
// Use the following palettes and mood cues as stylistic references.
// GPT may tweak hues, saturation, or blend with brand colors,
// but always ensure the result feels high-end, cohesive, and cinematic.

Design theme.background according to the project’s mood or industry:

- **Tech / SaaS / AI:**  
  style: 'energy' or 'gradient-scene'  
  palette hint: deep indigo, electric blue, violet accents, soft cyan glow  
  vibe: futuristic, minimal, confident, high contrast  
  example: ['#0f172a', '#1e293b', '#2563eb', '#38bdf8', '#a855f7']

- **Wellness / Yoga / Health:**  
  style: 'radial-glow' or 'gradient-scene'  
  palette hint: teal, mint, sky blue, subtle coral or sand  
  vibe: calm, fresh, rejuvenating, airy  
  example: ['#6ee7ff', '#3ae6b4', '#c4f1be', '#fef3c7', '#0b0b1f']

- **Fashion / Luxury / Beauty:**  
  style: 'mesh' or 'shapes'  
  palette hint: soft beige, rose, gold, deep charcoal, ivory  
  vibe: elegant, refined, glossy depth  
  example: ['#f9e2af', '#f5c2e7', '#cba6f7', '#4c3a51', '#1a1a1a']

- **Education / Culture / Knowledge:**  
  style: 'gradient-scene'  
  palette hint: warm amber, navy, ivory, soft blue  
  vibe: trustworthy, inspiring, balanced  
  example: ['#1e3a8a', '#2563eb', '#fbbf24', '#fde68a', '#f9fafb']

- **Creative / Studio / Agency:**  
  style: 'energy' or 'shapes'  
  palette hint: vivid magenta, neon blue, turquoise, dark slate  
  vibe: playful, energetic, premium, digital-native  
  example: ['#9333ea', '#3b82f6', '#06b6d4', '#0f172a', '#111827']

- **Corporate / Finance / Professional:**  
  style: 'mesh' or 'gradient-scene'  
  palette hint: navy, silver, deep gray, accent cyan  
  vibe: stable, intelligent, polished  
  example: ['#0f172a', '#1e293b', '#334155', '#38bdf8', '#cbd5e1']

General rules:
- Always pick colors that harmonize emotionally with the brand’s tone.  
- Default intensity: 'vivid' unless brand identity is minimal.  
- Default blendMode: 'screen' for bright, 'overlay' for dark.  
- Use particleField: true when subtle motion suits the brand.  
- Avoid flat white backgrounds unless explicitly requested.

Goal: create visually striking, emotionally tuned, premium backgrounds cohesive with the site's identity.

Always include a "heroImage" object that visually represents the website theme.
If unsure, imagine a cinematic hero image that captures the mood, palette, and style of the brand.

You may include a heroImage object to visually express the theme.
- Provide a vivid but concise prompt describing what should appear.
- Style can be 'photo', 'illustration', '3d', or 'cinematic'.
- Match the palette and emotion of the background.
- Set overlay true if the image should be softly blended behind content.

- style: one of 'mesh', 'radial-glow', 'shapes', 'energy', 'gradient-scene'
- palette: 3–5 harmonious colors matching the brand's tone
- intensity: 'soft' | 'balanced' | 'vivid' (default to 'vivid' if uncertain)
- optional: blendMode ('screen' | 'overlay' | 'lighten' | 'normal') and particleField (true if subtle motion fits)
Design the background to align emotionally with the brand and industry.
You generate an initial website JSON from a plain-English site brief. If the brief implies custom sections (not in the core schema), invent new section keys (lowercase, no spaces) and structure them with { title, body, items?[], images?[] }. Be faithful to the subject/domain and echo it in brand, hero, and copy. Keep copy concise. Output valid JSON only.`;
const user = `Site brief:
${brief}

Return the full SiteData JSON only.`;

    const resp = await client.chat.completions.create({
      response_format: { type: 'json_object' },
      model: MODEL,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user }
      ]
    });

    const text = resp.choices?.[0]?.message?.content?.trim() || '';
    const data = extractJSON(text);
    if (!data) {
      return Response.json({ ok: false, error: 'Model did not return JSON', raw: text }, { status: 502 });
    }
    // Lightweight sanity check: ensure brief topic appears in output
    const low = (s: string) => (s || '').toLowerCase();
    const tokens = Array.from(new Set(low(brief).split(/[^a-z0-9]+/).filter(t => t.length > 3)));
    const hay = JSON.stringify(data).toLowerCase();
    if (tokens.length && !tokens.some(t => hay.includes(t))) {
      const resp2 = await client.chat.completions.create({
        model: MODEL,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: sys + '\nYou must explicitly reflect the brief subject in brand, hero, and copy.' },
          { role: 'user', content: user }
        ]
      });
      const text2 = resp2.choices?.[0]?.message?.content?.trim() || '';
      const data2 = extractJSON(text2);
      if (data2) {
        return Response.json({ ok: true, data: data2 }, { headers: { 'Cache-Control': 'no-store' } });
      }
    }
    
    // Auto-generate hero image if heroImage.prompt is provided
    const heroPrompt = (data as any)?.heroImage?.prompt;
    if (heroPrompt) {
      // Optional moderation for safety
      try {
        const mod = await client.moderations.create({ model: "omni-moderation-latest", input: heroPrompt });
        const result = (mod as any)?.results?.[0];
        if (result && (result.flagged === true)) {
          throw new Error("Hero image prompt flagged by moderation");
        }
      } catch (e) {
        throw new Error("Moderation error: " + (e as any)?.message);
      }

      // Generate the image (no fallback). Use cinematic wide size for hero.
      const img = await client.images.generate({
        model: "gpt-image-1",
        prompt: heroPrompt,
        size: "1536x1024",
        // background default is transparent/none; we want rich colors from prompt
      });
      const url = (img as any)?.data?.[0]?.url;
      if (!url) {
        throw new Error("Image generation failed: missing URL");
      }
      (data as any).media = (data as any).media || {};
      (data as any).media.hero = { url };
    }

    return Response.json({ ok: true, data }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err: any) {
    console.error('build route error', err);
    return Response.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
