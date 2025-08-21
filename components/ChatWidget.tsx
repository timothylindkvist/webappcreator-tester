
'use client'
import { useState, useRef, useEffect } from 'react'
import { streamChat } from '@/lib/aiStream'
import { useSite } from '@/store/site'

type Msg = { role: 'user' | 'assistant'; content: string }

export default function ChatWidget() {
  const {
    brief, setBrief, theme, sections,
    setData, applyTheme, addSection, removeSection, fixImages, redesign, rebuild
  } = useSite()

  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: '👋 I can design & edit your site live. Describe your business, audience, tone, colors, and sections.' }
  ])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => () => controllerRef.current?.abort(), [])

  async function send() {
    const trimmed = input.trim()
    if (!trimmed) return

    const next = [...messages, { role: 'user', content: trimmed } as Msg]
    setMessages(next)
    setInput('')
    setIsSending(true)

    controllerRef.current?.abort()
    controllerRef.current = new AbortController()

    try {
      let assistantBuf = ''
      for await (const line of streamChat({ messages: next, state: { brief, theme, sections } })) {
        if (line.type === 'assistant') {
          assistantBuf += line.delta
          setMessages((old) => {
            const copy = [...old]
            if (copy[copy.length - 1]?.role === 'assistant') {
              copy[copy.length - 1] = { role: 'assistant', content: assistantBuf }
            } else {
              copy.push({ role: 'assistant', content: assistantBuf })
            }
            return copy
          })
        } else if (line.type === 'toolEvent') {
          const ev = line.event
          if (ev.type === 'response.tool_call.completed') {
            const name = ev.tool_call?.name as string
            const args = ev.tool_call?.arguments ? JSON.parse(ev.tool_call.arguments) : {}
            switch (name) {
              case 'setSiteData':
                setData(args)
                break
              case 'updateBrief':
                if (typeof args.brief === 'string') setBrief(args.brief)
                break
              case 'applyTheme':
                applyTheme(args.theme || {})
                break
              case 'addSection':
                addSection(args.section, args.data ?? {})
                break
              case 'removeSection':
                removeSection(args.section)
                break
              case 'fixImages':
                fixImages()
                break
              case 'redesign':
                redesign(args.concept)
                break
              case 'rebuild':
                await rebuild()
                break
              default:
                console.warn('Unknown tool:', name, args)
            }
          }
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="h-full flex flex-col rounded-2xl border bg-white/5">
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'assistant' ? 'text-sm text-muted-foreground' : ''}>
            {m.content}
          </div>
        ))}
      </div>
      <div className="p-3 border-t flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => (e.key === 'Enter' ? send() : null)}
          placeholder="Describe your website, colors, sections…"
          className="flex-1 rounded-xl border px-3 py-2"
          disabled={isSending}
        />
        <button
          onClick={send}
          disabled={!input.trim() || isSending}
          className="rounded-xl px-4 py-2 bg-[var(--brand)] text-white disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  )
}
