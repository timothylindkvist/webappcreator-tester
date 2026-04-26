// Anthropic does not have an image generation API.
// Background images are not generated; the hero section renders with theme colors only.
export const runtime = 'edge';

export async function POST() {
  return new Response(JSON.stringify({ ok: false, url: null }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
