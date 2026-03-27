import { rateLimit } from '@/lib/ratelimit';
import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';

export const runtime = 'nodejs';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

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

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ ok: false, error: 'Missing OPENAI_API_KEY' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const site = body?.site || {};
    const brief = typeof body?.brief === 'string' ? body.brief : '';
    const lastUserMessage = [...messages].reverse().find((message) => message?.role === 'user')?.content || '';

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-5-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are an AI website editor.
Return only JSON with this shape: {"reply":"...","events":[{"name":"...","args":{...}}]}.
Use events to change the site. Prefer these events:
- applyTheme for palette or density updates
- updateSection for edits to an existing section by id
- insertSection for adding a new section
- deleteSection for removing a section
- setSiteData only for global fields like media.hero.url
Keep the reply short and clear.`,
        },
        {
          role: 'user',
          content: JSON.stringify({
            brief,
            currentSite: site,
            requestedChange: lastUserMessage,
          }),
        },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content?.trim() || '{}';
    const parsed = ChatResponseSchema.parse(JSON.parse(raw));
    return Response.json({ ok: true, reply: parsed.reply, events: parsed.events });
  } catch (err: any) {
    return Response.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
