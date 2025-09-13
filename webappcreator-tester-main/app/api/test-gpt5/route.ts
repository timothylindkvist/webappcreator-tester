// app/api/test-gpt5/route.ts
import { NextRequest } from "next/server";

export async function GET(_req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ ok: false, reason: "OPENAI_API_KEY missing" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const model = process.env.NEXT_PUBLIC_AI_MODEL || "gpt-5";

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are a test system." },
          { role: "user", content: "Reply with the word PONG only." },
        ],
        temperature: 0,
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      return new Response(
        JSON.stringify({ ok: false, status: resp.status, error: data }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const content = data?.choices?.[0]?.message?.content ?? "";
    return new Response(
      JSON.stringify({
        ok: true,
        model,
        reply: content.trim(),
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ ok: false, reason: "network_or_runtime_error", detail: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
