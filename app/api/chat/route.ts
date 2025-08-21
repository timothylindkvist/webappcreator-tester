export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const MODEL = process.env.NEXT_PUBLIC_AI_MODEL || 'gpt-5';

// NDJSON/SSE line helper (client trims optional "data:" already)
function sendJSON(
  controller: ReadableStreamDefaultController<Uint8Array>,
  obj: unknown
) {
  const enc = new TextEncoder();
  controller.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n`));
}

// -------- Tools (FLATTENED shape for your SDK) --------
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
      required: [],
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
    description: 'Add a section with structured content',
    strict: false,
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
        payload: {
          type: 'object',
          additionalProperties: true,
          properties: {
            title: { type: 'string' },
            subtitle: { type: 'string' },
            eyebrow: { type: 'string' },
            body: { type: 'string' },
            kicker: { type: 'string' },
            ctaLabel: { type: 'string' },
            ctaHref: { type: 'string' },
            secondaryCtaLabel: { type: 'string' },
            secondaryCtaHref: { type: 'string' },
            bullets: { type: 'array', items: { type: 'string' } },
            items: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: true,
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  body: { type: 'string' },
                  icon: { type: 'string' },
                  image: { type: 'string' },
                  alt: { type: 'string' },
                  href: { type: 'string' },
                },
              },
            },
            images: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: true,
                properties: {
                  src: { type: 'string' },
                  alt: { type: 'string' },
                  caption: { type: 'string' },
                },
              },
            },
            testimonials: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: true,
                properties: {
                  name: { type: 'string' },
                  role: { type: 'string' },
                  quote: { type: 'string' },
                  avatar: { type: 'string' },
                  rating: { type: 'number' },
                },
              },
            },
            plans: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: true,
                properties: {
                  name: { type: 'string' },
                  price: { type: 'string' },
                  period: { type: 'string' },
                  features: { type: 'array', items: { type: 'string' } },
                  ctaLabel: { type: 'string' },
                  ctaHref: { type: 'string' },
                  highlighted: { type: 'boolean' },
                },
              },
            },
            faqs: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: true,
                properties: {
                  q: { type: 'string' },
                  a: { type: 'string' },
                },
              },
            },
            layout: { type: 'string' },
            themeHint: { type: 'string' },
          },
        },
      },
      required: ['section', 'payload'],
    },
  },
  {
    type: 'function',
    name: 'patchSection',
    description: 'Patch a section with a shallow object merge',
    strict: false,
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
      properties: { section: { type: 'string' } },
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

// ---- System message (unchanged) ----
const systemMsg = {
  role: 'system' as const,
  content: [
    'You are “SiteCraft AI”, a senior product designer + copywriter + front-end engineer focused on small/medium business websites.',
    'Your job: turn any brief (even extremely vague) into a crisp site plan and polished, production-ready UI content.',
    'You think in components/sections and use the provided tools to make concrete changes immediately.',
    'Accessibility: WCAG 2.2 AA (focus rings, labels, landmark roles, aria where needed).',
    'Performance: aim LCP < 2.5s; keep above-the-fold minimal; prefer next/image; avoid heavy JS.',
    'SEO basics: single H1 per page, descriptive titles/meta, semantic HTML, alt text, sensible copy length.',
    'Consistency: coherent color palette, typographic scale, spacing rhythm, and consistent CTA language.',
    'IF USER IS VAGUE: Ask up to 3 concise bullet questions only (brand/audience/primary CTA). If any remain unanswered, pick sensible defaults and proceed. Do not stall.',
    'IF USER IS DETAILED: Mirror their requirements precisely; highlight conflicts and propose 1 safe resolution. Proceed without extra questions.',
    'Always show progress: when you can improve the canvas, call tools immediately (addSection, patchSection, setTheme, etc.).',
    'Site structure defaults: hero, about, features, social-proof/testimonials, pricing (if relevant), FAQ, final CTA.',
    'Copy style: benefit-first, scannable, short sentences, active voice, concrete outcomes; 4–6 sections total unless asked otherwise.',
    'Tone presets: clean, friendly, technical, luxury, playful, editorial.',
    'Typography: one heading family + one body family. Use setTypography.',
    'Color: ensure contrast ≥ 4.5:1; provide dark and light variants.',
    'Layouts: clear hierarchy; generous white space; mobile-first; keep CTAs visible above the fold.',
    'Prefer tools over free-form text when you can make a concrete change.',
    'Use patchSection to refine content iteratively.',
    'Use addSection/removeSection to restructure; setTheme/applyStylePreset/setTypography/setDensity for global look and feel.',
    'If images are missing or mismatched, call fixImages with a target section or pass "all".',
    'Ask up to 3 bullets only if needed.',
    'Defaults: goal="capture leads", audience="SMBs evaluating solutions", tone="clean/friendly", CTA="Get Started", palette brand:#3B82F6 accent:#22C55E neutral:#0B1220 on #FFFFFF, typography "Inter".',
    'Keep content safe and truthful.',
    'For each user turn: (a) confirm intent/plan (1–2 sentences), (b) call tools to apply changes, (c) if needed, ask ≤3 bullets, then continue building.',
  ].join('\n'),
};

// ...keep your imports, env, tools array, systemMsg, etc. unchanged

export async function POST(req: NextRequest) {
  const { messages = [], state } = await req.json();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const ping = setInterval(() => {
        try { controller.enqueue(new TextEncoder().encode(':ping\n')); }
        catch { clearInterval(ping); }
      }, 15000);

      try {
        // --- 1) Ask the model for a JSON Action Plan instead of tool-calls ---
        const actionSchema = {
          name: 'ActionPlan',
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              // Optional short summary for chat UI
              summary: { type: 'string' },
              // Steps that correspond 1:1 to your client switch cases
              steps: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    name: {
                      type: 'string',
                      enum: [
                        'updateBrief',
                        'rebuild',
                        'setTheme',
                        'addSection',
                        'removeSection',
                        'fixImages',
                        'applyStylePreset',
                        'setTypography',
                        'setDensity',
                        'patchSection',
                        'redesign',
                        'setSiteData'
                      ],
                    },
                    args: { type: 'object', additionalProperties: true }
                  },
                  required: ['name','args']
                }
              }
            },
            required: ['steps']
          },
          strict: true
        } as const;

        const planBuffer: string[] = [];

        const s = await client.responses.stream({
          model: process.env.NEXT_PUBLIC_AI_MODEL || 'gpt-5',
          // Give clear instructions to output JSON plan ONLY
          input: [
            systemMsg as any,
            {
              role: 'system',
              content:
                [
                  'TOOLS ARE UNAVAILABLE. Do not call any tools.',
                  'Instead, output ONLY JSON matching the ActionPlan schema.',
                  'Populate steps that directly implement the user request using these actions: setTheme, addSection, patchSection, setTypography, setDensity, applyStylePreset, removeSection, fixImages, rebuild, updateBrief, redesign, setSiteData.',
                  'Be concrete and minimal: 1–6 steps. No prose.'
                ].join('\n')
            } as any,
            {
              role: 'system',
              content:
                'Current site state (JSON):\n```json\n' +
                JSON.stringify(state ?? {}, null, 2) +
                '\n```'
            } as any,
            ...messages
          ],
          // force JSON output we can parse
           text_format: { type: 'json_schema', json_schema: actionSchema },
          // tools removed on purpose — gpt-5 won’t call them
          parallel_tool_calls: false
        });

        s.on('event', (event: any) => {
          // For json_schema, the model streams text deltas that form a single JSON object.
          if (event.type === 'response.output_text.delta') {
            planBuffer.push(event.delta ?? '');
            // optional: let the user see a tiny “working” message
            // sendJSON(controller, { type: 'assistant', delta: '' });
            return;
          }
          if (event.type === 'response.error') {
            sendJSON(controller, { type: 'error', message: event.error?.message || 'response error' });
          }
        });

        s.on('end', () => {
          try {
            const jsonText = planBuffer.join('').trim();
            const plan = JSON.parse(jsonText || '{}') as { summary?: string; steps: Array<{name:string; args:any}> };

            // 1) Show the optional summary in chat
            if (plan?.summary) {
              sendJSON(controller, { type: 'assistant', delta: plan.summary });
            }

            // 2) Re-emit each step as a synthetic client-side tool call
            for (const step of plan?.steps ?? []) {
              if (!step || typeof step.name !== 'string') continue;
              sendJSON(controller, { type: 'tool', name: step.name, args: step.args || {} });
            }
          } catch (err: any) {
            sendJSON(controller, { type: 'error', message: 'ActionPlan parse failed: ' + (err?.message || String(err)) });
          } finally {
            clearInterval(ping);
            controller.close();
          }
        });

        s.on('error', (err) => {
          clearInterval(ping);
          sendJSON(controller, { type: 'error', message: (err as any)?.message || 'stream error' });
          controller.close();
        });
      } catch (err: any) {
        clearInterval(ping);
        sendJSON(controller, { type: 'error', message: err?.message || 'stream failed' });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  });
}

