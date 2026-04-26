import { createSupabaseClient } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createSupabaseClient();
    if (!supabase) return Response.json({ ok: false, error: 'Storage not configured' }, { status: 503 });

    const { data, error } = await supabase
      .from('sites')
      .select('brief, site_data')
      .eq('id', id)
      .single();

    if (error || !data) return Response.json({ ok: false, error: 'Not found' }, { status: 404 });
    return Response.json({ ok: true, brief: data.brief, site: data.site_data });
  } catch (err: any) {
    return Response.json({ ok: false, error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}
