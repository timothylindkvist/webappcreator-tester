export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

function sendJSON(
  controller: ReadableStreamDefaultController<Uint8Array>,
  obj: any
) {
  const enc = new TextEncoder();
  controller.enqueue(enc.encode(JSON.stringify(obj) + '\n'));
}

const MODEL = process.env.NEXT_PUBLIC_AI_MODEL || 'gpt-5';

// Tools must include `strict` for this SDK version
const tools: OpenAI.Responses.Tool[] = [
  {
    type: 'function',
    name: 'updateBrief',
    description: 'Replace the current creative brief',
    strict: true,
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: { brief: { type: 'string', minLength: 1 } },
      required: ['brief'],
    },
  },
  {
    type: 'function',
    name: 'rebuild',
    description: 'Regenerate the entire site from the current brief',
    strict: true,
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {},
    },
  },
  {
    type: 'function',
    name: 'setTheme',
    description: 'Set the site color palette (CSS-safe values) and vibe label',
    strict: true,
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        brand: { type: 'string' },
        accent: { type: 'string' },
        background: { type: 'string' },
        foreground: { type: 'string' },
        vibe: { type: 'string' },
      },
      required: ['brand', 'accent', 'background', 'foreground'],
    },
  },
  {
    type: 'function',
    name: 'addSection',
    description: 'Add a section with strictly typed payloads',
    strict: true,
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        section: {
          type: 'string',
          enum: [
            'hero',
            'about',
            'features',
            'gallery',
            'testimonials',
            'pricing',
            'faq',
            'cta',
          ],
        },
        payload: { type: 'object', additionalProperties: true },
      },
      required: ['section'],
    },
  },
  {
    type: 'function',
    name: 'removeSection',
    description: 'Remove a section by key',
    strict: true,
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        section: {
          type: 'string',
          enum: [
            'hero',
            'about',
            'features',
            'gallery',
            'testimonials',
            'pricing',
            'faq',
            'cta',
          ],
        },
      },
      required: ['section'],
    },
  },
  {
    type: 'function',
    name: 'patchSection',
    description: 'Patch a section with a shallow object merge',
    strict: true,
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        section: {
          type: 'string',
          enum: [
            'hero',
            'about',
            'features',
            'gallery',
            'testimonials',
            'pricing',
            'faq',
            'cta',
            'theme',
          ],
        },
        content: { type: 'object', additionalProperties: true },
      },
      required: ['section', 'content'],
    },
  },
  {
    type: 'function',
    name: 'setTypography',
    description: 'Set a single font family name for headings and body',
    strict: true,
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: { font: { type: 'string' } },
      required: ['font'],
    },
  },
  {
    type: 'function',
    name: 'setDensity',
    description: 'Control global density',
    strict: true,
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        density: { type: 'string', enum: ['compact', 'cozy', 'comfortable'] },
      },
      required: ['density'],
    },
  },
  {
    type: 'function',
    name: 'applyStylePreset',
    description: 'Apply a named preset (e.g., playful, editorial)',
    strict: true,
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: { preset: { type: 'string' } },
      required: ['preset'],
    },
  },
  {
    type: 'function',
    name: 'fixImages',
    description: 'Fix image placeholders for a section or all',
    strict: true,
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        section: { type: 'string' }, // optional → fixes all when omitted
      },
    },
  },
  {
    type: 'function',
    name: 'redesign',
    description: 'High-level creative direction to refresh the look',
    strict: true,
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: { concept: { type: 'string' } },
      required: ['concept'],
    },
  },
];

const systemMsg = {
  role: 'system' as const,
  content: [
    // Identity & mission
    'You are “SiteCraft AI”, a senior product designer + copywriter + front-end engineer focused on small/medium business websites.',
    'Your job: turn any brief (even extremely vague) into a crisp site plan and polished, production-ready UI content.',
    'You think in components/sections and use the provided tools to make concrete changes immediately.',

    // Non-negotiables
    'Accessibility: WCAG 2.2 AA (focus rings, labels, landmark roles, aria where needed).',
    'Performance: aim LCP < 2.5s; keep above-the-fold minimal; prefer next/image; avoid heavy JS.',
    'SEO basics: single H1 per page, descriptive titles/meta, semantic HTML, alt text, sensible copy length.',
    'Consistency: coherent color palette, typographic scale, spacing rhythm, and consistent CTA language.',

    // How to behave with different user types
    'IF USER IS VAGUE: Ask up to 3 concise bullet questions only (brand/audience/primary CTA). If any remain unanswered, pick sensible defaults and proceed. Do not stall.',
    'IF USER IS DETAILED: Mirror their requirements precisely; highlight any conflicts and propose 1 safe resolution. Proceed without extra questions.',
    'Always show progress: when you can improve the canvas, call tools immediately (addSection, patchSection, setTheme, etc.).',

    // Output quality bar
    'Site structure defaults: hero, about, features, social-proof/testimonials, pricing (if relevant), FAQ, final CTA.',
    'Copy style: benefit-first, scannable, short sentences, active voice, concrete outcomes; 4–6 sections total unless asked otherwise.',
    'Tone presets (examples): clean, friendly, technical, luxury, playful, editorial. Use “applyStylePreset” or setTheme + setTypography accordingly.',
    'Typography: one heading family + one body family. Use setTypography. Keep line-length ~60–75 chars.',
    'Color: choose accessible pairs; ensure text contrast ≥ 4.5:1; provide dark and light variants.',
    'Layouts: clear visual hierarchy; generous white space; mobile-first; avoid edge-to-edge long lines; keep CTAs visible above the fold.',

    // Tooling policy
    'Golden rule: prefer tools over free-form text when you can make a concrete change.',
    'Use patchSection to refine content iteratively (e.g., fix headings, bullets, CTAs).',
    'Use addSection/removeSection to restructure; setTheme/applyStylePreset/setTypography/setDensity for global look and feel.',
    'If images are missing or mismatched, call fixImages with a target section or leave it blank to fix all.',
    'Do not invent external assets or credentials; do not assume write access beyond the provided tools.',

    // Clarifying micro-questions (max 3, only if needed)
    'When needed, ask up to 3 bullets, exactly like:',
    '1) Primary goal? (e.g., book demo / contact / purchase)',
    '2) Audience? (1 sentence)',
    '3) Brand direction? (e.g., clean tech blue / luxury serif / playful pastel)',

    // Vague → default fallbacks (only if unanswered)
    'Defaults if unanswered: goal=“capture leads”, audience=“SMBs evaluating solutions”, tone=“clean/friendly”, CTA=“Get Started”, palette=brand:#3B82F6, accent:#22C55E, neutral=#0B1220 on #FFFFFF, typography=heading “Inter”, body “Inter”.',

    // Safety & editing rules
    'Never output discriminatory or unsafe content. Keep claims truthful and generic unless user provides specifics.',
    'If user instructions conflict with accessibility/perf basics, warn once, propose a compliant alternative, then proceed with the safest option.',

    // Response format expectations
    'For each user turn: (a) briefly confirm intent and plan (1–2 sentences), (b) immediately call tools to apply changes, (c) if needed, ask at most 3 bullets, then continue building.',
  ].join('\n'),
};


export async function POST(req: NextRequest) {
  const { messages = [], state } = await req.json();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const ping = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(':ping\n'));
        } catch {
          clearInterval(ping);
        }
      }, 15000);

      try {
        const s = await client.responses.stream({
          model: MODEL,
          // ✅ responses.stream expects `input`, not `messages`
          input: [systemMsg as any, ...messages],
          tools,
          tool_choice: 'auto',
          parallel_tool_calls: true,
          temperature: 0.7,
        });

        s.on('text.delta', (delta) =>
          sendJSON(controller, { type: 'assistant', delta })
        );

        s.on('tool.call', (toolCall) => {
          const name = toolCall.name;
          let args: any = {};
          try {
            args = toolCall.arguments ? JSON.parse(toolCall.arguments) : {};
          } catch {}
          sendJSON(controller, { type: 'tool', name, args });
        });

        s.on('end', () => {
          clearInterval(ping);
          controller.close();
        });

        s.on('error', (err) => {
          clearInterval(ping);
          sendJSON(controller, {
            type: 'error',
            message: (err as any)?.message || 'stream error',
          });
          controller.close();
        });
      } catch (err: any) {
        clearInterval(ping);
        sendJSON(controller, {
          type: 'error',
          message: err?.message || 'stream failed',
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
