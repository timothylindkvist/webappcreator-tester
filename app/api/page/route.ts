import Anthropic from '@anthropic-ai/sdk';
import { rateLimit } from '@/lib/ratelimit';
import { generatePage } from '@/lib/pageGenerator';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const ip = (req.headers.get('x-forwarded-for') || 'anon').split(',')[0];
  const rl = rateLimit(`page:${ip}`, 20, 60);
  if (!rl.ok) {
    return new Response(JSON.stringify({ error: 'rate_limited' }), { status: 429 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ ok: false, error: 'Missing ANTHROPIC_API_KEY' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { pageName, brief = '', designSystem = {}, existingPages = [], pageDescription = '' } = body;

    if (!pageName || typeof pageName !== 'string') {
      return Response.json({ ok: false, error: 'Missing pageName' }, { status: 400 });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const result = await generatePage(client, {
      pageName,
      brief,
      designSystem: {
        colors: designSystem.colors ?? {},
        brandName: designSystem.brandName ?? '',
      },
      existingPages,
      pageDescription,
    });

    return Response.json({ ok: true, ...result });
  } catch (err: any) {
    return Response.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
