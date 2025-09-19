import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest) {
  const model = process.env.OPENAI_MODEL || process.env.NEXT_PUBLIC_AI_MODEL || 'gpt-5';
  if (!process.env.OPENAI_API_KEY) {
    return new Response(JSON.stringify({ ok: false, reason: 'OPENAI_API_KEY missing' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a quick status probe. Reply with one short sentence.' },
          { role: 'user', content: 'Say hello from the test endpoint.' },
        ],
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      return new Response(JSON.stringify({ ok: false, reason: 'openai_error', detail: t }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const json = await resp.json();
    const content = json.choices?.[0]?.message?.content ?? '';

    return new Response(JSON.stringify({ ok: true, model, reply: String(content).trim() }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, reason: 'network_or_runtime_error', detail: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
