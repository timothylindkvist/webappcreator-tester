import OpenAI from 'openai';

export const runtime = 'nodejs';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SCHEMA_HINT = `
Return ONE JSON object matching this TypeScript shape (no markdown, no backticks):

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
  gallery?: { title?: string; images?: { src: string; caption?: string; alt?: string }[] };
  testimonials?: { title?: string; items?: { quote: string; author?: string }[] };
  pricing?: { title?: string; plans?: { name: string; price?: string; features?: string[] }[] };
  faq?: { title?: string; items?: { q: string; a: string }[] };
  cta?: { title?: string; subtitle?: string; button?: { label: string; href?: string } };
};
`;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ error: 'Missing OPENAI_API_KEY' }, { status: 401 });
    }

    const { brief = '' } = await req.json();

    const model = process.env.OPENAI_MODEL || 'gpt-5';
    const rsp = await client.responses.create({
      model,
      instructions:
        'You are a website generator. Given a short business brief, output a complete SiteData JSON with tasteful, production-ready copy. Keep it concise.',
      input: `Brief:\n${brief}\n\n${SCHEMA_HINT}`,
      temperature: 0.3,
    });

    const text = (rsp as any).output_text?.trim() || '';
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) {
      return Response.json({ error: 'Model did not return JSON', raw: text }, { status: 502 });
    }
    const jsonStr = text.slice(start, end + 1);
    const data = JSON.parse(jsonStr);

    return Response.json({ ok: true, data }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err: any) {
    console.error('Build route error:', err);
    return Response.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
