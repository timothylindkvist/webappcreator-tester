// app/api/build/route.ts
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const MODEL = process.env.NEXT_PUBLIC_AI_MODEL || 'gpt-5';

// --- System guidance for Builder (polisher/enforcer) ---
const systemText = [
  'You are “SiteCraft AI”, a senior product designer + copywriter + front-end engineer focused on small/medium business websites.',
  'Your job: take the current design state (sections, theme, typography, etc.) and return a production-ready, well-structured JSON representation that the Builder UI can render directly.',
  '',
  // Non-negotiables
  'Accessibility: WCAG 2.2 AA (labels, roles, focus rings).',
  'Performance: LCP < 2.5s, minimal above-the-fold, use semantic HTML.',
  'SEO: single H1, descriptive titles/meta, semantic tags, alt text.',
  'Consistency: coherent palette, typographic scale, spacing rhythm, consistent CTAs.',
  '',
  // Output quality
  'Site structure defaults: hero, about, features, social-proof/testimonials, pricing (if relevant), FAQ, final CTA.',
  'Copy: benefit-first, scannable, short sentences, active voice, concrete outcomes.',
  'Tone: clean, friendly, technical, luxury, playful, or editorial depending on context.',
  'Typography: one heading + one body family. Line length ~60–75 chars.',
  'Color: contrast ≥ 4.5:1; provide light/dark variants if theme allows.',
  'Layout: clear hierarchy, generous white space, mobile-first, visible CTA above the fold.',
  '',
  // Output rules
  'Always return a single JSON object only, no prose, no explanations.',
  'The JSON must include the same shape as the input { sections: [...], theme, typography, density, etc. }',
  'Fill gaps with sensible defaults (goal="capture leads", audience="SMBs evaluating solutions", CTA="Get Started", palette brand:#3B82F6 accent:#22C55E background:#FFFFFF foreground:#0B1220, typography heading "Inter" body "Inter").',
  '',
  // Safety
  'Never output unsafe, discriminatory, or false content.',
  'If user data is inconsistent with accessibility/performance, correct it silently while preserving intent.',
].join('\n');

export async function POST(req: NextRequest) {
  const { state } = await req.json();

  try {
    const completion = await client.responses.create({
      model: MODEL,
      // ✅ Responses API uses `input` with content types like `input_text`
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: systemText }],
        },
        {
          role: 'user',
          content: [
            { type: 'input_text', text: 'Here is the current site state. Please return a corrected, production-ready JSON only.' },
            { type: 'input_text', text: JSON.stringify(state ?? {}) },
          ],
        },
      ],
      response_format: { type: 'json_object' }, // ✅ force valid JSON
      temperature: 0.4,
    });

    // Pull the model's JSON output safely
    // The SDK returns a structured object; in JSON mode, the first output is the JSON string.
    const out = completion.output?.[0];
    if (out?.type === 'message' && out.content?.[0]?.type === 'output_text') {
      const json = out.content[0].text || '{}';
      return new Response(json, { headers: { 'Content-Type': 'application/json' } });
    }

    // Fallback: stringify the entire response if shape differs
    return new Response(JSON.stringify({ error: 'No JSON returned', raw: completion }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Build failed' }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
