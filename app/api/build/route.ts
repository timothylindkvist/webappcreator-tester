import OpenAI from 'openai';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || process.env.NEXT_PUBLIC_AI_MODEL || 'gpt-5';

const SCHEMA = String.raw`
Return ONE JSON object only (no markdown, no prose, no code fences). It MUST match this TypeScript shape:
type Theme = {
  vibe?: string;
  palette: { brand: string; accent: string; background: string; foreground: string };
  typography?: { body?: string; headings?: string };
  density?: 'compact' | 'cozy' | 'comfortable';
};
type SiteData = {
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
You generate an initial website JSON from a plain-English site brief. Be faithful to the domain (industry, audience, tone). Prefer concise copy and plausible defaults. Output strictly valid JSON.`;
    const user = `Site brief:
${brief}

Return the full SiteData JSON only.`;

    const resp = await client.chat.completions.create({
      model: MODEL,
      response_format: { type: 'json_object' },
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
    return Response.json({ ok: true, data }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err: any) {
    console.error('build route error', err);
    return Response.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
