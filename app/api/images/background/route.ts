import OpenAI from 'openai';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * POST /api/images/background
 * Body: { brief: string, palette?: string[] }
 * Returns: { ok: true, url: string }
 */
export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ ok: false, error: 'Missing OPENAI_API_KEY' }, { status: 401 });
  }

  try {
    const { brief, palette } = await req.json();

    if (!brief || typeof brief !== 'string') {
      return Response.json({ ok: false, error: 'Missing brief' }, { status: 400 });
    }

    const paletteText = Array.isArray(palette) && palette.length
      ? `Palette hints: ${palette.join(', ')}.`
      : '';

    const prompt = [
      `Ultra high quality, cinematic website background, no text, no logos, no watermarks.`,
      `Subject/theme: ${brief}.`,
      `Composition: depth, tasteful lighting, subtle bokeh; center-safe for hero text overlay; avoid faces close-up unless relevant.`,
      `Style: cohesive, modern, brand-ready; suitable for overlay with white or dark text; minimal clutter.`,
      paletteText
    ].filter(Boolean).join(' ');

    const image = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1536x1024",
      // IMPORTANT: do not set temperature; the image API doesn't support it
    });

    const url = image?.data?.[0]?.url
      || (image?.data?.[0]?.b64_json ? `data:image/png;base64,${image.data[0].b64_json}` : null);

    if (!url) {
      return Response.json({ ok: false, error: 'Image generation returned no URL' }, { status: 502 });
    }

    return Response.json({ ok: true, url }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err: any) {
    console.error('background image error', err);
    return Response.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
