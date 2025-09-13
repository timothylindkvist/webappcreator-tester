// Legacy chat endpoint shim to avoid missing 'ai' deps during build.
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.text();
    return Response.json({
      ok: true,
      note: "This endpoint is deprecated. Use /api/build for site generation.",
      echo: body || null
    });
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ ok: true, note: "Use /api/build (POST) to generate a site." });
}
