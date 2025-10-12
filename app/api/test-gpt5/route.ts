import OpenAI from "openai";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { ok: false, error: "Missing OPENAI_API_KEY" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string") {
      return Response.json(
        { ok: false, error: "Missing or invalid prompt" },
        { status: 400 }
      );
    }

    const result = await client.images.generate({
      model: "gpt-image-1",
      prompt: prompt,
      size: "1024x1024",
    });

    const imageUrl =
      result.data?.[0]?.url ||
      (result.data?.[0]?.b64_json
        ? `data:image/png;base64,${result.data[0].b64_json}`
        : null);

    if (!imageUrl) {
      return Response.json(
        { ok: false, error: "No image URL returned" },
        { status: 502 }
      );
    }

    return Response.json({ ok: true, url: imageUrl });
  } catch (err: any) {
    console.error("test-gpt5 route error", err);
    return Response.json(
      { ok: false, error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
