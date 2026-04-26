import { createSupabaseClient } from '@/lib/supabase';
import { rateLimit } from '@/lib/ratelimit';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const ip = (req.headers.get('x-forwarded-for') || 'anon').split(',')[0];
  const rl = rateLimit(`builder:${ip}`, 30, 60);
  if (!rl.ok) return new Response(JSON.stringify({ error: 'rate_limited', reset: rl.reset }), { status: 429 });

  try {
    const { site, brief, id } = await req.json();

    const supabase = createSupabaseClient();
    if (!supabase) {
      // Supabase not configured — work without persistence
      return Response.json({ ok: true, id: id ?? null });
    }

    if (id) {
      const { error } = await supabase
        .from('sites')
        .upsert({ id, brief: brief ?? '', site_data: site, updated_at: new Date().toISOString() });
      if (error) throw error;
      return Response.json({ ok: true, id });
    } else {
      const { data, error } = await supabase
        .from('sites')
        .insert({ brief: brief ?? '', site_data: site })
        .select('id')
        .single();
      if (error) throw error;
      return Response.json({ ok: true, id: data.id });
    }
  } catch (err: any) {
    return Response.json({ ok: false, error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}
