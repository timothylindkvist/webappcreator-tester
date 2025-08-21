'use client'
import { useEffect, useRef, useState } from 'react'
import { useBuilder } from '@/components/builder-context'

type Msg = { role: 'user' | 'assistant'; content: string }

export default function ChatWidget() {
  const {
    brief,
    setBrief,
    data,
    setData,
    applyTheme,
    addSection,
    removeSection,
    fixImages,
    applyStylePreset,
    setTypography,
    setDensity,
    patchSection,
    redesign,
    rebuild,
  } = useBuilder()

  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'assistant',
      content:
        '👋 I handle everything. Describe your website (business, audience, tone, colors, sections)…',
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const controllerRef = useRef<AbortController | null>(null)
  const assistantIndexRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      controllerRef.current?.abort()
    }
  }, [])

  async function send() {
    const trimmed = input.trim()
    if (!trimmed) return

    // Prepare payload for the server using the *current* messages + new user msg
    const userMsg: Msg = { role: 'user', content: trimmed }
    const payloadMessages = [...messages, userMsg]

    // Optimistically render user msg + an empty assistant bubble
    // and remember where the assistant bubble is
    assistantIndexRef.current = payloadMessages.length
    setMessages((cur) => [...cur, userMsg, { role: 'assistant', content: '' }])
    setInput('')
    setIsTyping(true)

    // Cancel any previous request
    controllerRef.current?.abort()
    controllerRef.current = new AbortController()

    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payloadMessages, state: { brief, data } }),
        signal: controllerRef.current.signal,
      })

      if (!res.ok || !res.body) {
        throw new Error(`Request failed: ${res.status}`)
      }

      reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        // We expect NDJSON lines. If your server ever prefixes SSE "data: ",
        // the parser below strips it safely.
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const raw of lines) {
          const line = raw.trim()
          if (!line || line.startsWith(':ping')) continue

          let json = line
          if (json.startsWith('data:')) json = json.slice(5).trim()

          let msg: any
          try {
            msg = JSON.parse(json)
          } catch {
            continue
          }

          // 1) Text deltas from the assistant
          if (msg.type === 'assistant' && typeof msg.delta === 'string') {
            setMessages((cur) => {
              const copy = [...cur]
              const idx =
                assistantIndexRef.current != null ? assistantIndexRef.current : copy.length - 1
              const prev = copy[idx]?.content || ''
              copy[idx] = { role: 'assistant', content: prev + msg.delta }
              return copy
            })
            continue
          }

          // 2) Tool calls (your server emits explicit 'tool' messages)
          if (msg.type === 'tool') {
            const args = msg.args || {}
            let confirm = ''

            switch (msg.name) {
              case 'updateBrief':
                setBrief(args.brief)
                confirm = `\n\n📝 Updated brief.`
                break
              case 'rebuild':
                await rebuild()
                confirm = `\n\n🔄 Rebuilt the site.`
                break
              case 'setTheme': {
                const { brand, accent, background, foreground, vibe } = args
                applyTheme({ brand, accent, background, foreground, vibe })
                confirm = `\n\n🎨 Applied theme${vibe ? ` (${vibe})` : ''}.`
                break
              }
              case 'addSection':
                addSection(args.section, args.payload)
                confirm = `\n\n➕ Added section “${args.section}”.`
                break
              case 'removeSection':
                removeSection(args.section)
                confirm = `\n\n➖ Removed section “${args.section}”.`
                break
              case 'fixImages':
                fixImages(args.section)
                confirm = `\n\n🖼️ Fixed images${args.section ? ` in “${args.section}”` : ''}.`
                break
              case 'applyStylePreset':
                applyStylePreset(args.preset)
                confirm = `\n\n🎭 Applied style preset “${args.preset}”.`
                break
              case 'setTypography':
                setTypography(args.font)
                confirm = `\n\n🔤 Typography → ${args.font}.`
                break
              case 'setDensity':
                setDensity(args.density)
                confirm = `\n\n📐 Density → ${args.density}.`
                break
              case 'patchSection':
                patchSection(args.section, args.content)
                confirm = `\n\n✏️ Updated “${args.section}”.`
                break
              case 'redesign':
                redesign(args.concept)
                confirm = `\n\n✨ Redesigned layout.`
                break
              case 'setSiteData':
                setData(args) // replace entire object
                confirm = `\n\n🧩 Applied full site structure.`
                break
            }

            if (confirm) {
              setMessages((cur) => {
                const copy = [...cur]
                const idx =
                  assistantIndexRef.current != null ? assistantIndexRef.current : copy.length - 1
                copy[idx] = {
                  role: 'assistant',
                  content: (copy[idx]?.content || '') + confirm,
                }
                return copy
              })
            }
            continue
          }

          // 3) Some builds emit 'toolEvent' objects; we can ignore or log them
          if (msg.type === 'toolEvent') {
            // Optionally: console.log('toolEvent', msg.event)
            continue
          }

          // 4) Error payloads
          if (msg.type === 'error') {
            setMessages((cur) => {
              const copy = [...cur]
              const idx =
                assistantIndexRef.current != null ? assistantIndexRef.current : copy.length - 1
              copy[idx] = {
                role: 'assistant',
                content: (copy[idx]?.content || '') + `\n\n⚠️ ${msg.message}`,
              }
              return copy
            })
          }
        }
      }
    } catch (err: any) {
      setMessages((cur) => {
        const copy = [...cur]
        const idx = assistantIndexRef.current != null ? assistantIndexRef.current : copy.length - 1
        copy[idx] = {
          role: 'assistant',
          content: (copy[idx]?.content || '') + `\n\n⚠️ ${err?.message || 'Stream failed'}`,
        }
        return copy
      })
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
            <div
              className={
                'inline-block max-w-[85%] whitespace-pre-wrap rounded-xl border px-3 py-2 text-sm ' +
                (m.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted')
              }
            >
              {m.content}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="mt-1 text-xs text-muted-foreground">
            Assistant is typing…
          </div>
        )}
      </div>

      <div className="p-2 border-t flex gap-2">
        <input
          className="flex-1 rounded-xl border px-3 py-2 bg-background"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your website, colors, sections…"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
        />
        <button
          onClick={send}
          className="rounded-xl px-4 py-2 bg-primary text-primary-foreground disabled:opacity-50"
          disabled={!input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  )
}
