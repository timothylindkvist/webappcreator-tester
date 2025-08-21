// components/Chat.tsx
'use client'
import { useState } from 'react'
import { streamChat } from '@/lib/aiStream'
import { handleToolEvent } from '@/lib/toolRuntime'

export default function Chat() {
  const [assistant, setAssistant] = useState('')

  async function send(messages: any[], state?: any) {
    setAssistant('')
    for await (const msg of streamChat({ messages, state })) {
      if (msg.type === 'assistant') {
        setAssistant((t) => t + msg.delta)
      } else if (msg.type === 'toolEvent') {
        handleToolEvent(msg.event)
      } else if (msg.type === 'error') {
        console.error(msg.message)
      }
    }
  }

  return (
    <div className="p-4 space-y-4">
      <button
        className="px-4 py-2 rounded bg-black text-white"
        onClick={() => send([{ role: 'user', content: 'Create a hero and features section for a SaaS timer app.' }])}
      >
        Demo: Build sections
      </button>
      <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded">{assistant}</pre>
    </div>
  )
}