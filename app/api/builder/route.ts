import { rateLimit } from '@/lib/ratelimit';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const ip = (req.headers.get('x-forwarded-for') || 'anon').split(',')[0];
  const rl = rateLimit(`post:${ip}`, 30, 60);
  if (!rl.ok) return new Response(JSON.stringify({ error: 'rate_limited', reset: rl.reset }), { status: 429 });

  try {
    const body = await req.json();
    const site = body?.site || {};
    // No database persistence yet — echo back the site for the client to store.
    return Response.json({ ok: true, site, reply: 'Saved site', events: [] });
  } catch (err: any) {
    return Response.json({ ok: false, error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}
