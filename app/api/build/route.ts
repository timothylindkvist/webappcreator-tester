import OpenAI from "openai";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ ok: false, error: "Missing OPENAI_API_KEY" }, { status: 401 });
  }

  try {
    // ✅ Ensure we declare data before using it
    const data = await req.json();
    const { brief, theme, heroImage } = data;

    const refinedPrompt =
      brief && typeof brief === "string"
        ? `Create website copy and structure for: ${brief}`
        : "Create default site structure";

    // === Hero Image Generation (Scoped and Safe) ===
    const heroPrompt =
      heroImage?.prompt || refinedPrompt || "cinematic vivid brand hero image";

    const refined = await client.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content:
            "You are a professional webapp designer. Create a JSON spec describing the site based on the user's brief.",
        },
        {
          role: "user",
          content: refinedPrompt,
        },
      ],
    });

    const content = refined.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    return Response.json({ ok: true, data: parsed, heroPrompt });
  } catch (err: any) {
    console.error("build error", err);
    return Response.json(
      { ok: false, error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
