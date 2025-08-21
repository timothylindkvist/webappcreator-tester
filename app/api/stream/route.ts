// app/api/stream/route.ts
export const runtime = 'edge'

import OpenAI from 'openai'
import { StreamingTextResponse } from 'ai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function POST(req: Request) {
  const { messages = [] } = await req.json()

  // Plain chat streaming (no tools) for visible “typing”
  const stream = await client.chat.completions.create({
    model: process.env.NEXT_PUBLIC_AI_MODEL || 'gpt-4o-mini',
    stream: true,
    messages,
    temperature: 0.7,
  })

  return new StreamingTextResponse(stream)
}
