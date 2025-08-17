
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { streamText, tool } from 'ai';
import { MODEL } from '@/lib/models';
import { createGateway } from '@ai-sdk/gateway';

/**
 * We stream Server-Sent Events (SSE) as NDJSON lines:
 * {"type":"text","delta":"..."}        // incremental assistant text
 * {"type":"tool","data":{...}}         // tool instruction to execute on client
 * {"type":"done"}                      // end of stream
 */

const gateway = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY });

const ToolInstruction = z.discriminatedUnion('type', [
  z.object({ type: z.literal('updateBrief'), brief: z.string().min(1) }),
  z.object({ type: z.literal('rebuild') }),
  z.object({
    type: z.literal('setTheme'),
    palette: z.object({
      brand: z.string(),
      accent: z.string(),
      background: z.string(),
      foreground: z.string(),
    }),
  }),
  z.object({ type: z.literal('setStylePreset'), preset: z.enum(['minimal','playful','editorial','brutalist','luxury','retro']) }),
  z.object({ type: z.literal('setTypography'), heading: z.string(), body: z.string() }),
  z.object({ type: z.literal('setDensity'), density: z.enum(['compact','cozy','comfortable']) }),
  z.object({ type: z.literal('patchSection'), section: z.enum(['hero','about','features','gallery','testimonials','pricing','faq','cta']), content: z.record(z.any()) }),
  z.object({ type: z.literal('suggestPaletteFromBrand'), keywords: z.string(), palette: z.object({ brand: z.string(), accent: z.string(), background: z.string(), foreground: z.string() }).optional() }),
  z.object({ type: z.literal('redesign'), directives: z.string().min(1), keep: z.object({ palette: z.boolean().optional(), layout: z.boolean().optional(), copyTone: z.boolean().optional() }).optional() }),
  z.object({ type: z.literal('addSection'), section: z.enum(['features','gallery','testimonials','pricing','faq']), payload: z.record(z.any()) }),
  z.object({ type: z.literal('removeSection'), section: z.enum(['features','gallery','testimonials','pricing','faq']) }),
  z.object({ type: z.literal('fixImages'), seed: z.string().default('fallback') }),
  z.object({ type: z.literal('explainError'), message: z.string() }),
]);

export async function POST(req: NextRequest) {
  const { messages, state } = await req.json();

  const system = `
You are a DESIGN DIRECTOR + web copilot that LISTENS carefully.
- Make tasteful choices. You can change palette, layout density, typography, and copy when it improves the brief.
- Use tools to implement changes incrementally so the preview can update live.
- Keep replies concise. Never include secrets.
`;

  // Stream from the model with tool-calling. We'll forward chunks to the client as NDJSON over SSE.
  const result = await streamText({
    model: gateway ? gateway(MODEL) : (MODEL as any),
    system,
    messages,
    temperature: 0.3,
    tools: {
      updateBrief: tool({
        description: 'Replace current brief.',
        parameters: z.object({ brief: z.string().min(1) }),
        execute: async ({ brief }) => ({ type: 'updateBrief', brief }),
      }),
      rebuild: tool({ description: 'Rebuild the site.', parameters: z.object({}), execute: async () => ({ type: 'rebuild' }) }),
      setTheme: tool({
        description: 'Override CSS palette.',
        parameters: z.object({ brand: z.string(), accent: z.string(), background: z.string(), foreground: z.string() }),
        execute: async (p) => ({ type: 'setTheme', palette: p }),
      }),
      setStylePreset: tool({
        description: 'Apply a style preset.',
        parameters: z.object({ preset: z.enum(['minimal','playful','editorial','brutalist','luxury','retro']) }),
        execute: async ({ preset }) => ({ type: 'setStylePreset', preset }),
      }),
      setTypography: tool({
        description: 'Set heading/body fonts.',
        parameters: z.object({ heading: z.string(), body: z.string() }),
        execute: async ({ heading, body }) => ({ type: 'setTypography', heading, body }),
      }),
      setDensity: tool({
        description: 'Set spacing density.',
        parameters: z.object({ density: z.enum(['compact','cozy','comfortable']) }),
        execute: async ({ density }) => ({ type: 'setDensity', density }),
      }),
      patchSection: tool({
        description: 'Replace a specific section with new content.',
        parameters: z.object({ section: z.enum(['hero','about','features','gallery','testimonials','pricing','faq','cta']), content: z.record(z.any()) }),
        execute: async ({ section, content }) => ({ type: 'patchSection', section, content }),
      }),
      suggestPaletteFromBrand: tool({
        description: 'Propose a tasteful palette for given brand keywords.',
        parameters: z.object({ keywords: z.string() }),
        execute: async ({ keywords }) => ({ type: 'suggestPaletteFromBrand', keywords }),
      }),
      redesign: tool({
        description: 'High-level redesign with directives; client will rebuild.',
        parameters: z.object({ directives: z.string().min(1), keep: z.object({ palette: z.boolean().optional(), layout: z.boolean().optional(), copyTone: z.boolean().optional() }).optional() }),
        execute: async ({ directives, keep }) => ({ type: 'redesign', directives, keep }),
      }),
      addSection: tool({
        description: 'Add/replace an optional section.',
        parameters: z.object({ section: z.enum(['features','gallery','testimonials','pricing','faq']), payload: z.record(z.any()) }),
        execute: async ({ section, payload }) => ({ type: 'addSection', section, payload }),
      }),
      removeSection: tool({
        description: 'Remove an optional section.',
        parameters: z.object({ section: z.enum(['features','gallery','testimonials','pricing','faq']) }),
        execute: async ({ section }) => ({ type: 'removeSection', section }),
      }),
      fixImages: tool({
        description: 'Replace missing images with placeholders.',
        parameters: z.object({ seed: z.string().default('fallback') }).partial(),
        execute: async ({ seed = 'fallback' }) => ({ type: 'fixImages', seed }),
      }),
      explainError: tool({
        description: 'Explain an error to the user.',
        parameters: z.object({ message: z.string() }),
        execute: async ({ message }) => ({ type: 'explainError', message }),
      }),
    },
    // Provide state for better patches
    maxToolRoundtrips: 10,
    experimental_providerMetadata: { state },
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // text chunks
      (async () => {
        for await (const event of result.fullStream) {
          if (event.type === 'text-delta') {
            controller.enqueue(encoder.encode(JSON.stringify({ type: 'text', delta: event.textDelta }) + '\n'));
          } else if (event.type === 'tool-call' || event.type === 'tool-result') {
            // We only forward the result payload (our tool execute output)
            if (event.type === 'tool-result') {
              controller.enqueue(encoder.encode(JSON.stringify({ type: 'tool', data: event.result }) + '\n'));
            }
          } else if (event.type === 'error') {
            controller.enqueue(encoder.encode(JSON.stringify({ type: 'error', message: event.error?.message || 'stream error' }) + '\n'));
          } else if (event.type === 'finish') {
            controller.enqueue(encoder.encode(JSON.stringify({ type: 'done' }) + '\n'));
          }
        }
        controller.close();
      })().catch((e) => {
        controller.enqueue(encoder.encode(JSON.stringify({ type: 'error', message: String(e?.message || e) }) + '\n'));
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
