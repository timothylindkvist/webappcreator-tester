
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { generateObject } from 'ai';
import { MODEL } from '@/lib/models';
import { createGateway } from '@ai-sdk/gateway';

export const maxDuration = 30;

// Tool instruction schema to be executed on the client
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
  z.object({
    type: z.literal('addSection'),
    section: z.enum(['features','gallery','testimonials','pricing','faq']),
    payload: z.record(z.any()),
  }),
  z.object({
    type: z.literal('removeSection'),
    section: z.enum(['features','gallery','testimonials','pricing','faq']),
  }),
  z.object({ type: z.literal('fixImages'), seed: z.string().default('fallback') }),
  z.object({ type: z.literal('explainError'), message: z.string() }),
]);

const OutputSchema = z.object({
  assistant: z.string().default(''),
  tools: z.array(ToolInstruction).default([]),
});

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY, // optional
});

export async function POST(req: NextRequest) {
  const { messages, state } = await req.json();

  const system = `
You are a website-building copilot that LISTENS carefully to the user's intent.
- If the user describes a business or changes, emit tools to update the brief and rebuild.
- If they ask for colors, emit setTheme with a tasteful palette.
- If sections need changes, add/remove sections with minimal payloads.
- After tool calls, include a short "assistant" summary of what changed.
Keep outputs concise. Never leak secrets. Use placeholders unless real data is provided.
`;

  // We let the model decide which tools to call by producing the instruction list
  const { object } = await generateObject({
    model: gateway ? gateway(MODEL) : (MODEL as any),
    system,
    prompt: JSON.stringify({ messages, state }),
    schema: OutputSchema,
    temperature: 0.2,
  });

  return new Response(JSON.stringify(object), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
