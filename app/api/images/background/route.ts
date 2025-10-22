import { sha256String } from '@/lib/hash';

const BG_CACHE: Map<string, any> =
  (globalThis as any).__bg_cache__ || new Map();
(globalThis as any).__bg_cache__ = BG_CACHE;

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const key = await sha256String(JSON.stringify(body));

    // ✅ Serve cached image if we have it
    if (BG_CACHE.has(key)) {
      return new Response(JSON.stringify(BG_CACHE.get(key)), { status: 200 });
    }

    const prompt = body?.prompt || body?.brief || 'abstract gradient background';
    const palette = body?.palette || [];

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing OPENAI_API_KEY' }),
        { status: 500 }
      );
    }

    // --- your OpenAI call here ---
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: `${prompt}. Style: minimalistic, ${palette.join(', ')}`,
        size: '1024x768',
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenAI image error', err);
      return new Response(JSON.stringify({ error: err }), { status: 500 });
    }

    const data = await response.json();
    const result = { url: data.data?.[0]?.url ?? null };

    // ✅ Cache successful results
    BG_CACHE.set(key, result);

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (err: any) {
    console.error('background route error', err);
    return new Response(
      JSON.stringify({ error: err?.message ?? 'Unknown error' }),
      { status: 500 }
    );
  }
}
