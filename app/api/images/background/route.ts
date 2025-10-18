import OpenAI from "openai";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

function isDescriptive(brief: string) {
  if (!brief) return false;
  const keywords = ["photo","ocean","reef","diver","coffee","gym","yoga","studio","restaurant","cafe","shop","ecommerce","mountain","forest","city","skyline","tech","circuit","saas","startup","fitness","nature","abstract","pattern","texture","background","hero","banner","illustration","3d","render","painting","architecture","interior","underwater","space","galaxy","stars"];
  const b = brief.toLowerCase();
  return keywords.some(k => b.includes(k));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const brief: string = body?.brief || "";
    const palette: string[] = Array.isArray(body?.palette) ? body.palette : [];

    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ ok: false, error: "Missing OPENAI_API_KEY" }, { status: 401 });
    }

    if (!isDescriptive(brief)) {
      const brand = palette?.[0] || "#7C3AED";
      const accent = palette?.[1] || "#06B6D4";
      return Response.json({ ok: true, gradient: { from: brand, to: accent } });
    }

    const prompt = `High-quality website background for: ${brief}. Wide composition, no text, aesthetic, subtle, professional. Soft lighting, gentle contrast; looks great behind UI.`;

    const image = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      size: "1792x1024",
      quality: "standard",
    });

    const url = image?.data?.[0]?.url;
    if (!url) return Response.json({ ok: false, error: "No image URL returned" }, { status: 502 });
    return Response.json({ ok: true, url });
  } catch (err: any) {
    console.error("images/background error", err);
    return Response.json({ ok: false, error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
