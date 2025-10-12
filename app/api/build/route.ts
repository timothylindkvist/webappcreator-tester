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
    const data = await req.json();
    const { brief } = data;

    const refinedPrompt =
      brief && typeof brief === "string"
        ? `Create website copy and structure for: ${brief}`
        : "Create default site structure";

    // --- Step 1: Generate the site layout using GPT-5 ---
    const refined = await client.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content:
            "You are a professional webapp designer. Create a JSON spec describing the site based on the user's brief.",
        },
        { role: "user", content: refinedPrompt },
      ],
    });

    const content = refined.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    // --- Step 2: Generate a DALL·E background image automatically ---
    const image = await client.images.generate({
      model: "dall-e-3",
      prompt: `High-quality background image for a website about: ${brief}`,
      size: "1792x1024",
    });

    const imageUrl = image.data?.[0]?.url;
    if (imageUrl) {
      if (!parsed.hero) parsed.hero = {};
      parsed.hero.backgroundImage = imageUrl;
    }

    return Response.json({ ok: true, data: parsed });
  } catch (err: any) {
    console.error("build error", err);
    return Response.json(
      { ok: false, error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
