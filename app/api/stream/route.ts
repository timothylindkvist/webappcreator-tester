// app/api/stream/route.ts
export const runtime = 'edge'

import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function POST(req: Request) {
  const { messages = [] } = await req.json()

  // SSE stream using OpenAI's native streaming API (no ai-sdk/next needed)
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder()

      // keep-alive pings
      const ping = setInterval(() => {
        try {
          controller.enqueue(enc.encode(':ping\n\n'))
        } catch {
          clearInterval(ping)
        }
      }, 15000)

      try {
        // Use Chat Completions streaming for a clean, text-first stream
        const completion = await client.chat.completions.create({
          model: process.env.NEXT_PUBLIC_AI_MODEL || 'gpt-4o-mini',
          stream: true,
          messages, // [{ role: 'user'|'assistant'|'system', content: '...' }, ...]
          temperature: 0.7,
        })

        for await (const chunk of completion) {
          const delta = chunk.choices?.[0]?.delta?.content
          if (delta) {
            // SSE event: "message" by default (data: ...)
            controller.enqueue(enc.encode(`data: ${JSON.stringify({ delta })}\n\n`))
          }
        }

        clearInterval(ping)
        controller.close()
      } catch (err: any) {
        controller.enqueue(
          enc.encode(`event: error\ndata: ${JSON.stringify({ message: err?.message || 'stream error' })}\n\n`)
        )
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
