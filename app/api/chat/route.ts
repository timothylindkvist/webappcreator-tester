
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest } from 'next/server'
import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
const MODEL = process.env.NEXT_PUBLIC_AI_MODEL || 'gpt-4.1-mini'

function sendJSON(controller: ReadableStreamDefaultController<Uint8Array>, obj: any) {
  const enc = new TextEncoder()
  controller.enqueue(enc.encode(JSON.stringify(obj) + '\n'))
}

export async function POST(req: NextRequest) {
  const { messages = [], state = {} } = await req.json()

  const tools = [
    {
      name: 'setSiteData',
      description: 'Replace or merge the whole site data (theme and sections).',
      parameters: {
        type: 'object',
        properties: {
          theme: {
            type: 'object',
            properties: {
              vibe: { type: 'string' },
              palette: {
                type: 'object',
                properties: {
                  brand: { type: 'string' },
                  accent: { type: 'string' },
                  background: { type: 'string' },
                  foreground: { type: 'string' },
                }
              },
              typography: { type: 'object' },
              density: { type: 'string' },
            }
          },
          sections: { type: 'object', additionalProperties: true }
        }
      }
    },
    {
      name: 'updateBrief',
      description: 'Update the working creative brief',
      parameters: { type: 'object', properties: { brief: { type: 'string' } }, required: ['brief'] }
    },
    {
      name: 'applyTheme',
      description: 'Change colors/typography/density',
      parameters: { type: 'object', properties: { theme: { type: 'object', additionalProperties: true } }, required: ['theme'] }
    },
    {
      name: 'addSection',
      description: 'Add or replace a specific section with data',
      parameters: { type: 'object', properties: { section: { type: 'string' }, data: { type: 'object', additionalProperties: true } }, required: ['section'] }
    },
    {
      name: 'removeSection',
      description: 'Remove a section',
      parameters: { type: 'object', properties: { section: { type: 'string' } }, required: ['section'] }
    },
    { name: 'fixImages', description: 'Ensure gallery images have URLs', parameters: { type: 'object', properties: {} } },
    { name: 'redesign', description: 'Change vibe or overall art direction', parameters: { type: 'object', properties: { concept: { type: 'string' } } } },
    { name: 'rebuild', description: 'Trigger a full rebuild using the latest brief', parameters: { type: 'object', properties: {} } },
  ] as const

  const system = [
    'You are SiteCraft AI, a senior product designer and copywriter.',
    'You control a website builder via tools. When the user requests changes, CALL TOOLS instead of only replying.',
    'Work iteratively: setSiteData for big initial layouts, then addSection/applyTheme for edits, removeSection as needed.',
    'When adding content, produce simple, realistic text, not placeholders.',
    'Keep responses short while you work.',
    `Current UI state: ${JSON.stringify(state).slice(0, 12000)}`,
  ].join('\n')

  const stream = await client.responses.stream({
    model: MODEL,
    input: [
      { role: 'system', content: system },
      ...messages
    ],
    tools: tools as any,
    tool_choice: 'auto',
  })

  const rs = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder()

      // assistant output
      stream.on('response.output_text.delta', (evt) => {
        sendJSON(controller, { type: 'assistant', delta: evt.delta })
      })
      stream.on('response.completed', () => controller.close())
      stream.on('event', (event) => {
      if (event.type === 'response.error') {
       sendJSON(controller, {
      type: 'error',
      message: String((event as any)?.error?.message || 'error'),
    })
    controller.close()
  }
})

      // tool events passthrough
      stream.on('response.tool_call.created', (ev) => sendJSON(controller, { type: 'toolEvent', event: ev }))
      stream.on('response.tool_call.delta', (ev) => sendJSON(controller, { type: 'toolEvent', event: ev }))
      stream.on('response.tool_call.completed', (ev) => sendJSON(controller, { type: 'toolEvent', event: ev }))

      await stream.finalize()
    }
  })

  return new Response(rs, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
