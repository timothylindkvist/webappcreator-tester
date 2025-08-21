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

// ---- Tools (strict schemas; required includes every key in properties) ----
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
      required: [], // explicit for this SDK
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
      required: ['brand', 'accent', 'background', 'foreground', 'vibe'],
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
  name: 'addSection',
  description: 'Add a section with strictly typed payloads',
  strict: true,
  parameters: {
    type: 'object',
    additionalProperties: false,
    properties: {
      section: {
        type: 'string',
        enum: ['hero','about','features','gallery','testimonials','pricing','faq','cta'],
      },
      payload: {
        type: 'object',
        additionalProperties: false,
        properties: {
          // common fields
          title: { type: 'string' },
          subtitle: { type: 'string' },
          eyebrow: { type: 'string' },
          body: { type: 'string' },
          kicker: { type: 'string' },

          // CTAs
          ctaLabel: { type: 'string' },
          ctaHref: { type: 'string' },
          secondaryCtaLabel: { type: 'string' },
          secondaryCtaHref: { type: 'string' },

          // lists / bullets
          bullets: { type: 'array', items: { type: 'string' } },

          // items (features/cards/gallery etc.)
          items: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                body: { type: 'string' },
                icon: { type: 'string' },
                image: { type: 'string' },
                alt: { type: 'string' },
                href: { type: 'string' },
              },
              required: ['title','description','body','icon','image','alt','href'],
            },
          },

          // images
          images: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                src: { type: 'string' },
                alt: { type: 'string' },
                caption: { type: 'string' },
              },
              required: ['src','alt','caption'],
            },
          },

          // testimonials
          testimonials: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                name: { type: 'string' },
                role: { type: 'string' },
                quote: { type: 'string' },
                avatar: { type: 'string' },
                rating: { type: 'number' },
              },
              required: ['name','role','quote','avatar','rating'],
            },
          },

          // pricing
          plans: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                name: { type: 'string' },
                price: { type: 'string' },
                period: { type: 'string' },
                features: { type: 'array', items: { type: 'string' } },
                ctaLabel: { type: 'string' },
                ctaHref: { type: 'string' },
                highlighted: { type: 'boolean' },
              },
              required: ['name','price','period','features','ctaLabel','ctaHref','highlighted'],
            },
          },

          // faq
          faqs: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                q: { type: 'string' },
                a: { type: 'string' },
              },
              required: ['q','a'],
            },
          },

          // layout/style hints
          layout: { type: 'string' },
          themeHint: { type: 'string' },
        },
        // >>> This is the key addition:
        required: [
          'title',
          'subtitle',
          'eyebrow',
          'body',
          'kicker',
          'ctaLabel',
          'ctaHref',
          'secondaryCtaLabel',
          'secondaryCtaHref',
          'bullets',
          'items',
          'images',
          'testimonials',
          'plans',
          'faqs',
          'layout',
          'themeHint'
        ],
      },
    },
    required: ['section','payload'],
  },
}, // keep the comma to separate from the next tool

// next tool...
{
  type: 'function',
  name: 'patchSection',
  description: 'Patch a section with a shallow object merge',
  strict: false, // <-- allow open-ended content
  parameters: {
    type: 'object',
    additionalProperties: false,
    properties: {
      section: {
        type: 'string',
        enum: ['hero','about','features','gallery','testimonials','pricing','faq','cta','theme'],
      },
      content: {
        type: 'object',
        additionalProperties: true, // <-- arbitrary keys allowed
      },
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
      properties: { section: { type: 'string' } }, // pass 'all' to affect every section
      required: ['section'],
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

// ---- System guidance (vague + detailed users, action-first) ----
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

    // Behavior for different users
    'IF USER IS VAGUE: Ask up to 3 concise bullet questions only (brand/audience/primary CTA). If any remain unanswered, pick sensible defaults and proceed. Do not stall.',
    'IF USER IS DETAILED: Mirror their requirements precisely; highlight conflicts and propose 1 safe resolution. Proceed without extra questions.',
    'Always show progress: when you can improve the canvas, call tools immediately (addSection, patchSection, setTheme, etc.).',

    // Output quality bar
    'Site structure defaults: hero, about, features, social-proof/testimonials, pricing (if relevant), FAQ, final CTA.',
    'Copy style: benefit-first, scannable, short sentences, active voice, concrete outcomes; 4–6 sections total unless asked otherwise.',
    'Tone presets: clean, friendly, technical, luxury, playful, editorial. Use “applyStylePreset” or setTheme + setTypography accordingly.',
    'Typography: one heading family + one body family. Use setTypography. Keep line-length ~60–75 chars.',
    'Color: ensure contrast ≥ 4.5:1; provide dark and light variants.',
    'Layouts: clear hierarchy; generous white space; mobile-first; keep CTAs visible above the fold.',

    // Tooling policy
    'Prefer tools over free-form text when you can make a concrete change.',
    'Use patchSection to refine content iteratively (e.g., fix headings, bullets, CTAs).',
    'Use addSection/removeSection to restructure; setTheme/applyStylePreset/setTypography/setDensity for global look and feel.',
    'If images are missing or mismatched, call fixImages with a target section or pass "all".',
    'Do not invent external assets or credentials; do not assume write access beyond the provided tools.',

    // Clarifying micro-questions (max 3, only if needed)
    'Ask up to 3 bullets, exactly like:',
    '1) Primary goal? (e.g., book demo / contact / purchase)',
    '2) Audience? (1 sentence)',
    '3) Brand direction? (e.g., clean tech blue / luxury serif / playful pastel)',

    // Defaults (used only if unanswered)
    'Defaults: goal="capture leads", audience="SMBs evaluating solutions", tone="clean/friendly", CTA="Get Started", palette brand:#3B82F6 accent:#22C55E neutral:#0B1220 on #FFFFFF, typography heading "Inter" body "Inter".',

    // Safety
    'Never output discriminatory or unsafe content. Keep claims truthful unless user provides specifics.',
    'If instructions conflict with accessibility/perf basics, warn once, propose a compliant alternative, then proceed with the safest option.',

    // Response format
    'For each user turn: (a) confirm intent/plan (1–2 sentences), (b) call tools to apply changes, (c) if needed, ask ≤3 bullets, then continue building.',
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
          input: [systemMsg as any, ...messages], // Responses API uses `input` for streaming
          tools,
          tool_choice: 'auto',
          parallel_tool_calls: true,
          temperature: 0.7,
        });

        // Generic "event" handler is future-proof with this SDK
        s.on('event', (event: any) => {
          if (event.type === 'response.output_text.delta') {
            sendJSON(controller, { type: 'assistant', delta: event.delta });
            return;
          }
          if (
            event.type === 'response.tool_call.delta' ||
            event.type === 'response.tool_call.created' ||
            event.type === 'response.tool_call.completed'
          ) {
            sendJSON(controller, { type: 'toolEvent', event });
            return;
          }
          if (event.type === 'response.error') {
            sendJSON(controller, {
              type: 'error',
              message: event.error?.message || 'response error',
            });
          }
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
