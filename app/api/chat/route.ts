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
    // ✅ Must declare before using
    const data = await req.json();
    const { brief, theme, heroImage, messages } = data;

    const refinedPrompt =
      brief && typeof brief === "string"
        ? `Create chat response or structured web instructions for: ${brief}`
        : "Create general chat output";

    // === Hero Image Generation (Scoped and Safe) ===
    const heroPrompt =
      heroImage?.prompt || refinedPrompt || "cinematic vivid brand hero image";

    const chatCompletion = await client.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content:
            "You are a professional webapp assistant helping users design and describe their websites. Provide structured, clear, and aesthetic outputs.",
        },
        ...(Array.isArray(messages)
          ? messages
          : [{ role: "user", content: refinedPrompt }]),
      ],
    });

    const message = chatCompletion.choices?.[0]?.message?.content || "";
    return Response.json({ ok: true, reply: message, events: [] });
  } catch (err: any) {
    console.error("chat route error", err);
    return Response.json(
      { ok: false, error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
