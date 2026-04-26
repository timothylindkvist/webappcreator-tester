import Anthropic from '@anthropic-ai/sdk';
import { rateLimit } from '@/lib/ratelimit';
import { MODEL } from '@/lib/models';
import { NextRequest } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const EventSchema = z.object({
  name: z.enum(['setSiteData', 'updateBrief', 'applyTheme', 'addSection', 'removeSection', 'patchSection', 'setSections', 'insertSection', 'updateSection', 'moveSection', 'deleteSection']),
  args: z.record(z.any()).default({}),
});

const ChatResponseSchema = z.object({
  reply: z.string(),
  events: z.array(EventSchema).default([]),
});

export async function POST(req: NextRequest) {
  const ip = (req.headers.get('x-forwarded-for') || 'anon').split(',')[0];
  const rl = rateLimit(`chat:${ip}`, 30, 60);
  if (!rl.ok) {
    return new Response(JSON.stringify({ error: 'rate_limited', reset: rl.reset }), { status: 429 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ ok: false, error: 'Missing ANTHROPIC_API_KEY' }, { status: 401 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const body = await req.json();
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const site = body?.site || {};
    const brief = typeof body?.brief === 'string' ? body.brief : '';
    const lastUserMessage = [...messages].reverse().find((m: any) => m?.role === 'user')?.content || '';

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: `You are an AI website editor.
Return ONLY valid JSON — no markdown, no explanation, no code fences.
Shape: {"reply":"...","events":[{"name":"...","args":{...}}]}
Use events to change the site. Prefer:
- applyTheme for palette or density updates
- updateSection for edits to an existing section by id
- insertSection for adding a new section
- deleteSection for removing a section
- setSiteData only for global fields like media.hero.url
Keep the reply short and clear.`,
      messages: [
        {
          role: 'user',
          content: JSON.stringify({ brief, currentSite: site, requestedChange: lastUserMessage }),
        },
        { role: 'assistant', content: '{' },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const raw = '{' + responseText;
    const parsed = ChatResponseSchema.parse(JSON.parse(raw));
    return Response.json({ ok: true, reply: parsed.reply, events: parsed.events });
  } catch (err: any) {
    return Response.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
