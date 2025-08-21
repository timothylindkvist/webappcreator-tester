// app/api/build/route.ts
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const MODEL = process.env.NEXT_PUBLIC_AI_MODEL || 'gpt-5';

// System guidance
const systemText = [
  'You are “SiteCraft AI”, a senior product designer + copywriter + front-end engineer.',
  'Return a production-ready site state as a single JSON object only (no prose).',
  'Structure keys expected by the UI: hero, about, features, gallery, testimonials, pricing, theme { palette { brand, accent, background, foreground }, typography, density }.',
  'Defaults if missing: CTA="Get Started", palette brand:#3B82F6 accent:#22C55E background:#FFFFFF foreground:#0B1220, typography "Inter".',
  'Accessibility: WCAG 2.2 AA. Keep copy concise and scannable.',
].join('\n');

// JSON schema we want back (keep it permissive but guided)
const schema = {
  name: 'SiteState',
  schema: {
    type: 'object',
    additionalProperties: true,
    properties: {
      hero: {
        type: 'object',
        additionalProperties: true,
        properties: {
          title: { type: 'string' },
          subtitle: { type: 'string' },
        },
      },
      about: {
        type: 'object',
        additionalProperties: true,
        properties: {
          heading: { type: 'string' },
          body: { type: 'string' },
        },
      },
      features: {
        type: 'object',
        additionalProperties: true,
        properties: {
          title: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: true,
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                body: { type: 'string' },
              },
            },
          },
        },
      },
      gallery: { type: 'object', additionalProperties: true },
      testimonials: { type: 'object', additionalProperties: true },
      pricing: { type: 'object', additionalProperties: true },
      theme: {
        type: 'object',
        additionalProperties: true,
        properties: {
          palette: {
            type: 'object',
            additionalProperties: true,
            properties: {
              brand: { type: 'string' },
              accent: { type: 'string' },
              background: { type: 'string' },
              foreground: { type: 'string' },
            },
          },
          typography: { type: 'object', additionalProperties: true },
          density: { type: 'string' },
        },
      },
    },
  },
  strict: false,
} as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const state = body?.state ?? {};
    const brief: string | undefined = body?.brief;

    // Build the input: system + user content (state + optional brief)
    const userContext =
      'Current site state JSON:\n```json\n' +
      JSON.stringify(state ?? {}, null, 2) +
      '\n```' +
      (brief ? `\n\nBrief:\n${brief}` : '');

    const completion = await client.responses.create({
  model: MODEL,
  input: [
    { role: 'system', content: systemText },
    { role: 'user', content: userContext },
  ],
  response_format: {
    type: "json_schema",
    json_schema: schema,
  },
  temperature: 0.2,
});

    // Prefer the convenience field if available; else fall back to manual scan
    const text =
      (completion as any).output_text ??
      (completion.output || [])
        .map((it: any) =>
          it.type === 'message' &&
          it.content?.[0]?.type === 'output_text' &&
          it.content?.[0]?.text
            ? it.content[0].text
            : '',
        )
        .join('');

    let json: any = {};
    try {
      json = JSON.parse(text || '{}');
    } catch {
      // last resort: return empty object to avoid crashing the client
      json = {};
    }

    return new Response(JSON.stringify(json), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response('{}', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
