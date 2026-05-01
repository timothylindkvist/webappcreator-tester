import Anthropic from '@anthropic-ai/sdk';
import { rateLimit } from '@/lib/ratelimit';
import { MODEL } from '@/lib/models';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const ip = (req.headers.get('x-forwarded-for') || 'anon').split(',')[0];
  const rl = rateLimit(`brief:${ip}`, 10, 60);
  if (!rl.ok) {
    return new Response(JSON.stringify({ error: 'rate_limited' }), { status: 429 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ ok: false, error: 'Missing ANTHROPIC_API_KEY' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { description, answers } = body;
    if (!description || typeof description !== 'string') {
      return Response.json({ ok: false, error: 'Missing description' }, { status: 400 });
    }

    let answersContext = '';
    if (answers && typeof answers === 'object') {
      const parts: string[] = [];
      if (answers.style) parts.push(`Style direction: ${answers.style}`);
      if (answers.audience) parts.push(`Target audience: ${answers.audience}`);
      if (answers.goal) parts.push(`Primary goal: ${answers.goal}`);
      if (answers.theme) parts.push(`Colour theme preference: ${answers.theme}`);
      if (parts.length > 0) {
        answersContext = '\n\nClient preferences:\n' + parts.join('\n');
      }
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      system: `You are a senior web designer writing a creative brief for a client project.
Write a focused design brief (150–200 words) based on the client's description and any stated preferences.
Return ONLY the brief text — no headers, no bullet points, no markdown, no labels.
Write in flowing professional prose, like you're briefing a talented creative team.
Cover: the business type and who it serves, the emotional tone and visual personality, which sections make most sense for this specific business and why, a concrete color palette (2–3 specific hex codes with names), typography mood, and the key message the homepage should land.
If colour theme preference is "Dark" or "Light", reflect that in the palette. If "Vibrant & colourful", choose bold expressive hex codes.
Be specific and evocative. Avoid generic phrases like "modern design" or "clean layout" — describe the actual vibe, e.g. "the palette draws from aged oak and raw concrete, projecting craft and permanence." Sound like you understand this business deeply.`,
      messages: [
        { role: 'user', content: `Write a design brief for: ${description}${answersContext}` },
      ],
    });

    const brief = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
    return Response.json({ ok: true, brief });
  } catch (err: any) {
    return Response.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
