export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

function sendJSON(controller: ReadableStreamDefaultController<Uint8Array>, obj: any) {
  const enc = new TextEncoder();
  controller.enqueue(enc.encode(JSON.stringify(obj) + '\n'));
}

const MODEL = process.env.NEXT_PUBLIC_AI_MODEL || 'gpt-5';

const tools: OpenAI.Responses.Tool[] = [
  const tools: OpenAI.Responses.Tool[] = [
  {
    type: "function",
    name: "updateBrief",
    description: "Replace the current creative brief",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        brief: { type: "string", minLength: 1 },
      },
      required: ["brief"],
    },
  },
  {
    type: "function",
    name: "rebuild",
    description: "Regenerate the entire site from the current brief",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {},
    },
  },
  {
    type: "function",
    name: "setTheme",
    description: "Set the site color palette (CSS-safe values) and vibe label",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        brand: { type: "string" },
        accent: { type: "string" },
        background: { type: "string" },
        foreground: { type: "string" },
        vibe: { type: "string" },
      },
      required: ["brand", "accent", "background", "foreground"],
    },
  },
  {
    type: "function",
    name: "addSection",
    description: "Add a section with strictly typed payloads",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        section: {
          type: "string",
          enum: [
            "hero",
            "about",
            "features",
            "gallery",
            "testimonials",
            "pricing",
            "faq",
            "cta",
          ],
        },
        payload: { type: "object", additionalProperties: true },
      },
      required: ["section"],
    },
  },
  {
    type: "function",
    name: "removeSection",
    description: "Remove a section by key",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        section: {
          type: "string",
          enum: [
            "hero",
            "about",
            "features",
            "gallery",
            "testimonials",
            "pricing",
            "faq",
            "cta",
          ],
        },
      },
      required: ["section"],
    },
  },
  {
    type: "function",
    name: "patchSection",
    description: "Patch a section with a shallow object merge",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        section: {
          type: "string",
          enum: [
            "hero",
            "about",
            "features",
            "gallery",
            "testimonials",
            "pricing",
            "faq",
            "cta",
            "theme",
          ],
        },
        content: { type: "object", additionalProperties: true },
      },
      required: ["section", "content"],
    },
  },
  {
    type: "function",
    name: "setTypography",
    description: "Set a single font family name for headings and body",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        font: { type: "string" },
      },
      required: ["font"],
    },
  },
  {
    type: "function",
    name: "setDensity",
    description: "Control global density",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        density: { type: "string", enum: ["compact", "cozy", "comfortable"] },
      },
      required: ["density"],
    },
  },
  {
    type: "function",
    name: "applyStylePreset",
    description: "Apply a named preset (e.g., playful, editorial)",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        preset: { type: "string" },
      },
      required: ["preset"],
    },
  },
  {
    type: "function",
    name: "fixImages",
    description: "Fix image placeholders for a section or all",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        section: { type: "string" }, // optional → fixes all when omitted
      },
    },
  },
  {
    type: "function",
    name: "redesign",
    description: "High-level creative direction to refresh the look",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        concept: { type: "string" },
      },
      required: ["concept"],
    },
  },
];
];

const systemMsg = {
  role: 'system' as const,
  content: [
    'You are a senior product designer + copywriter for SMB sites.',
Accessibility (WCAG 2.2 AA), performance (LCP < 2.5s), and SEO basics by default.
    Use the provided tools for any file changes. Never assume write access.
    'MANDATES:',
    '• Always propose a crisp site plan and high-quality UI. (hero + about + features + CTA) even if user is vague.',
    '• Prefer showing work: call tools immediately when you can make a concrete change.',
    '• Benefit-led copy, scannable bullets, 4–6 sections total unless the user requests otherwise.',
    '• Always pick a coherent palette (valid CSS colors), typography, and clear CTA.',
    '• If the brief is unclear, ask up to 3 concise bullets, then continue building.',
    
  ].join(' '),
};

export async function POST(req: NextRequest) {
  const { messages = [], state } = await req.json();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const ping = setInterval(() => {
        try { controller.enqueue(new TextEncoder().encode(':ping\n')); } catch { clearInterval(ping); }
      }, 15000);

      try {
        const s = await client.responses.stream({
          model: MODEL,
          messages: [systemMsg as any, ...messages],
          tools,
          tool_choice: 'auto',
          parallel_tool_calls: true,
          temperature: 0.7,
        });

        s.on('text.delta', (delta) => sendJSON(controller, { type: 'assistant', delta }));
        s.on('tool.call', (toolCall) => {
          const name = toolCall.name;
          let args: any = {};
          try { args = toolCall.arguments ? JSON.parse(toolCall.arguments) : {}; } catch {}
          sendJSON(controller, { type: 'tool', name, args });
        });

        s.on('end', () => {
          clearInterval(ping);
          controller.close();
        });

        s.on('error', (err) => {
          clearInterval(ping);
          sendJSON(controller, { type: 'error', message: err?.message || 'stream error' });
          controller.close();
        });
      } catch (err: any) {
        clearInterval(ping);
        sendJSON(controller, { type: 'error', message: err?.message || 'stream failed' });
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
