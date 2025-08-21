// app/api/build/route.ts
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const MODEL = process.env.NEXT_PUBLIC_AI_MODEL || 'gpt-5';

// --- System guidance ---
const systemText = [
  'You are “SiteCraft AI”, a senior product designer + copywriter + front-end engineer focused on small/medium business websites.',
  'Your job: take the current design state (sections, theme, typography, etc.) and return a production-ready, well-structured JSON representation that the Builder UI can render directly.',
  '',
  'Accessibility: WCAG 2.2 AA (labels, roles, focus rings).',
  'Performance: LCP < 2.5s, minimal above-the-fold, use semantic HTML.',
  'SEO: single H1, descriptive titles/meta, semantic tags, alt text.',
  'Consistency: coherent palette, typographic scale, spacing rhythm, consistent CTAs.',
  '',
  'Site structure defaults: hero, about, features, social-proof/testimonials, pricing (if relevant), FAQ, final CTA.',
  'Copy: benefit-first, scannable, short sentences, active voice, concrete outcomes.',
  'Tone: clean, friendly, technical, luxury, playful, or editorial depending on context.',
  'Typography: one heading + one body family. Line length ~60–75 chars.',
  'Color: contrast ≥ 4.5:1; provide light/dark variants if theme allows.',
  'Layout: clear hierarchy, generous white space, mobile-first, visible CTA above the fold.',
  '',
  'Always return a single JSON object only, no prose, no explanations.',
  'The JSON must include the same shape as the input { sections: [...], theme, typography, density, etc. }',
  'Fill gaps with sensible defaults (goal="capture leads", audience="SMBs evaluating solutions", CTA="Get Started", palette brand:#3B82F6 accent:#22C55E background:#FFFFFF foreground:#0B1220, typography heading "Inter" body "Inter").',
  '',
  'Never output unsafe, discriminatory, or false content.',
  'If user data is inconsistent with accessibility/performance, correct it silently while preserving intent.',
].join('\n');

export async function POST(req: NextRequest) {
  try {
    const { state } = await req.json();

    const prompt =
      systemText +
      '\n\n' +
      'Return ONLY a single JSON object. No prose. Here is the current site state JSON:\n' +
      JSON.stringify(state ?? {}, null, 2);

    const completion = await client.responses.create({
      model: MODEL,
      input: prompt,
      temperature: 0.4,
    });

    // ✅ Safely extract text output
    let jsonText = '{}';
    for (const item of completion.output ?? []) {
      if (item.type === 'message') {
        const msg = item.content?.[0];
        if (msg?.type === 'output_text' && msg.text) {
          jsonText = msg.text;
          break;
        }
      }
    }

    return new Response(jsonText, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response('{}', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
