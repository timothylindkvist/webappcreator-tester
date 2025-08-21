// components/StreamChatDemo.tsx
'use client'
import { useChat } from 'ai/react'
import { useEffect, useRef } from 'react'

export default function StreamChatDemo() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/stream', // our new streaming endpoint
  })
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  return (
    <div className="w-full max-w-2xl space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="flex-1 rounded border px-3 py-2"
          placeholder="Say hi and watch it stream…"
          value={input}
          onChange={handleInputChange}
        />
        <button
          disabled={isLoading}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          type="submit"
        >
          Send
        </button>
      </form>

      <div ref={ref} className="h-64 overflow-y-auto rounded border p-3 text-sm">
        {messages.map((m) => (
          <div key={m.id} className="mb-2">
            <strong>{m.role === 'user' ? 'You' : 'Assistant'}:</strong>{' '}
            <span>{m.content}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
