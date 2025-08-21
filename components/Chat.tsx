
'use client'
import { useState } from 'react'
import { streamChat } from '@/lib/aiStream'
import { handleToolEvent } from '@/lib/toolRuntime'
import { useSite } from '@/store/site'

export default function Chat() {
  const [assistant, setAssistant] = useState('')
  const state = useSite()

  async function send() {
    setAssistant('')
    const messages = [{ role: 'user', content: 'Create a hero and features section for a SaaS timer app.' } ]
    for await (const msg of streamChat({ messages, state })) {
      if (msg.type === 'assistant') {
        setAssistant((t) => t + msg.delta)
      } else if (msg.type === 'toolEvent') {
        handleToolEvent(msg.event)
      }
    }
  }

  return (
    <div className="p-4 space-y-4">
      <button className="px-4 py-2 rounded bg-[var(--brand)] text-white" onClick={send}>
        Demo: Build sections
      </button>
      <pre className="whitespace-pre-wrap text-sm bg-white/5 p-3 rounded border border-white/10">{assistant}</pre>
    </div>
  )
}
