
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
  // NEW: design-level controls
  z.object({ type: z.literal('setStylePreset'), preset: z.enum(['minimal','playful','editorial','brutalist','luxury','retro']) }),
  z.object({ type: z.literal('setTypography'), heading: z.string(), body: z.string() }),
  z.object({ type: z.literal('setDensity'), density: z.enum(['compact','cozy','comfortable']) }),
  // Section patching (server suggests new content based on provided state)
  z.object({
    type: z.literal('patchSection'),
    section: z.enum(['hero','about','features','gallery','testimonials','pricing','faq','cta']),
    content: z.record(z.any())
  }),
  // Palette ideation from brand keywords
  z.object({ type: z.literal('suggestPaletteFromBrand'), keywords: z.string(), palette: z.object({
    brand: z.string(), accent: z.string(), background: z.string(), foreground: z.string()
  }).optional() }),
  // High-level redesign: apply directives then rebuild
  z.object({
    type: z.literal('redesign'),
    directives: z.string().min(1), // what to change; client will merge into brief and rebuild
    keep: z.object({ palette: z.boolean().optional(), layout: z.boolean().optional(), copyTone: z.boolean().optional() }).optional()
  }),
  // Utilities
  z.object({ type: z.literal('addSection'), section: z.enum(['features','gallery','testimonials','pricing','faq']), payload: z.record(z.any()) }),
  z.object({ type: z.literal('removeSection'), section: z.enum(['features','gallery','testimonials','pricing','faq']) }),
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
You are a DESIGN DIRECTOR + web copilot that LISTENS to the user.
You may change theme, layout, or copy when it improves the brief. Be tasteful and opinionated, not just obedient.

You have access to the current "state" (brief and data). When users ask for changes, output a series of tool instructions to implement them:
- updateBrief / redesign: update the brief or add directives; then rebuild.
- setTheme or suggestPaletteFromBrand: choose an on-brand palette (brand/accent/background/foreground).
- setStylePreset: minimal / playful / editorial / brutalist / luxury / retro.
- setTypography: heading and body font families (use safe, widely-available fonts or system stacks).
- setDensity: compact/cozy/comfortable (affects spacing variables).
- patchSection: return JSON for a specific section only (use the existing state to keep consistency).
- addSection / removeSection / fixImages.
After tools, include a short assistant summary.
Keep outputs concise and never include secrets.
`;

  const { object } = await generateObject({
    model: gateway ? gateway(MODEL) : (MODEL as any),
    system,
    // Give the model access to the current brief & data to make targeted patches
    prompt: JSON.stringify({ messages, state }),
    schema: OutputSchema,
    temperature: 0.3,
  });

  return new Response(JSON.stringify(object), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
