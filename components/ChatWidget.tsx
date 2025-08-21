'use client'
import { useEffect, useRef, useState } from 'react'
import { useBuilder } from '@/components/builder-context'

export default function ChatWidget() {
<<<<<<< HEAD
  const { addSection, patchSection, setTheme } = useBuilder();
=======
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

>>>>>>> bca90faad890ea65b9a7059caf10c0e171881ae6
  const [messages, setMessages] = useState<Msg[]>([
<<<<<<< HEAD
    { role: 'assistant', content: '👋 I handle everything. Describe your website (business, audience, tone, colors, sections)…' },
  ]);
  const [input, setInput] = useState('');
  const toolBufRef = useRef<Record<string, { name?: string; args: string }>>({});
=======
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
>>>>>>> bca90faad890ea65b9a7059caf10c0e171881ae6

<<<<<<< HEAD
=======
  // Buffer for streaming tool calls (Responses API)
  const toolBufRef = useRef<Record<string, { name?: string; args: string }>>({})

  useEffect(() => {
    return () => controllerRef.current?.abort()
  }, [])

>>>>>>> bca90faad890ea65b9a7059caf10c0e171881ae6
  async function send() {
    if (!input.trim()) return;
    const userMsg: Msg = { role: 'user', content: input.trim() };
    setMessages((cur) => [...cur, userMsg]);
    setInput('');

<<<<<<< HEAD
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [...messages, userMsg], state: {} }),
    });
=======
    const userMsg: Msg = { role: 'user', content: trimmed }
    const payloadMessages = [...messages, userMsg]

    // Optimistic UI: add user + an empty assistant bubble
    assistantIndexRef.current = payloadMessages.length
    setMessages((cur) => [...cur, userMsg, { role: 'assistant', content: '' }])
    setInput('')
    setIsTyping(true)
>>>>>>> bca90faad890ea65b9a7059caf10c0e171881ae6

<<<<<<< HEAD
    const reader = res.body?.getReader();
    if (!reader) return;
=======
    // cancel any previous request
    controllerRef.current?.abort()
    controllerRef.current = new AbortController()
>>>>>>> bca90faad890ea65b9a7059caf10c0e171881ae6

<<<<<<< HEAD
    // assistant bubble
    const idx = messages.length + 1;
    setMessages((cur) => [...cur, { role: 'assistant', content: '' }]);

    const dec = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += dec.decode(value, { stream: true });

      let lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim() || line.startsWith(':ping')) continue;

        let m: any;
        try { m = JSON.parse(line); } catch { continue; }

        if (m.type === 'assistant' && typeof m.delta === 'string') {
          setMessages((cur) => {
            const copy = [...cur];
            copy[idx] = { role: 'assistant', content: (copy[idx]?.content || '') + m.delta };
            return copy;
          });
        }

        if (m.type === 'toolEvent') {
          const ev = m.event;
          if (ev.type === 'response.tool_call.created') {
            toolBufRef.current[ev.id] = { name: ev.name, args: '' };
          }
          if (ev.type === 'response.tool_call.delta') {
            const buf = toolBufRef.current[ev.id] || { args: '' };
            buf.args += ev.delta ?? '';
            toolBufRef.current[ev.id] = buf;
          }
          if (ev.type === 'response.tool_call.completed') {
            const buf = toolBufRef.current[ev.id];
            delete toolBufRef.current[ev.id];
            try {
              const args = buf?.args ? JSON.parse(buf.args) : {};
              switch (buf?.name) {
                case 'patchSection':
                  patchSection(args.section, args.content);
                  break;
                case 'addSection':
                  addSection(args.section, args.payload ?? {});
                  break;
                case 'setTheme':
                  setTheme(args);
                  break;
              }
              setMessages((cur) => {
                const copy = [...cur];
                copy[idx] = { role: 'assistant', content: (copy[idx]?.content || '') + `\n\n🛠 ${buf?.name} applied.` };
                return copy;
              });
            } catch {
              setMessages((cur) => {
                const copy = [...cur];
                copy[idx] = { role: 'assistant', content: (copy[idx]?.content || '') + `\n\n⚠️ Tool args parse failed.` };
                return copy;
              });
=======
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payloadMessages, state: { brief, data } }),
        signal: controllerRef.current.signal,
      })
      if (!res.ok || !res.body) throw new Error(`Request failed: ${res.status}`)

      reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const raw of lines) {
          let line = raw.trim()
          if (!line || line.startsWith(':ping')) continue
          if (line.startsWith('data:')) line = line.slice(5).trim()

          let msg: any
          try {
            msg = JSON.parse(line)
          } catch {
            continue
          }

          // ====== TEXT DELTAS ======
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

          // ====== RESPONSES API TOOL STREAMING ======
          if (msg.type === 'toolEvent') {
            const ev = msg.event || {}
            const evType: string = ev.type || ''
            const id: string | undefined = ev.id || ev.tool_call_id || ev.call_id

            // created -> remember tool name
            if (evType === 'response.tool_call.created' && id) {
              const name = ev.name || ev.tool_name || ev.tool?.name
              toolBufRef.current[id] = { name, args: '' }
            }

            // delta -> accumulate args
            if (evType === 'response.tool_call.delta' && id) {
              const deltaArgs =
                ev.delta?.arguments ??
                ev.delta?.args ??
                ev.arguments_delta ??
                ev.arguments ??
                ''
              if (!toolBufRef.current[id]) toolBufRef.current[id] = { name: ev.name, args: '' }
              toolBufRef.current[id].args += String(deltaArgs)
            }

            // completed -> parse & execute
            if (evType === 'response.tool_call.completed' && id) {
              const entry = toolBufRef.current[id] || { name: ev.name, args: '' }
              const toolName = entry.name || ev.name || ev.tool_name
              let args: any = {}
              try {
                args = entry.args ? JSON.parse(entry.args) : {}
              } catch {
                try {
                  args = JSON.parse(
                    entry.args?.replace(/,\s*]$/, ']')?.replace(/,\s*}$/, '}') || '{}'
                  )
                } catch {}
              }

              let confirm = ''
              switch (toolName) {
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
                  setData(args)
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

              delete toolBufRef.current[id]
            }

            continue
          }

          // ====== FALLBACK: synthetic tool messages (if your API ever sends them) ======
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
>>>>>>> bca90faad890ea65b9a7059caf10c0e171881ae6
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

          // ====== ERROR PAYLOADS ======
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

        if (m.type === 'error') {
          setMessages((cur) => {
            const copy = [...cur];
            copy[idx] = { role: 'assistant', content: (copy[idx]?.content || '') + `\n\n⚠️ ${m.message}` };
            return copy;
          });
        }
      }
<<<<<<< HEAD
=======
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
>>>>>>> bca90faad890ea65b9a7059caf10c0e171881ae6
    }
  }

  return (
    <div className="h-full flex flex-col bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
<<<<<<< HEAD
          <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
            <div className={'inline-block max-w-[85%] whitespace-pre-wrap rounded-xl border px-3 py-2 text-sm ' + (m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
              {m.content}
            </div>
=======
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
>>>>>>> bca90faad890ea65b9a7059caf10c0e171881ae6
          </div>
        ))}
        {isTyping && <div className="mt-1 text-xs text-muted-foreground">Assistant is typing…</div>}
      </div>
<<<<<<< HEAD
      <div className="p-2 border-t flex gap-2">
=======

      <div className="p-2 border-t flex gap-2">
>>>>>>> bca90faad890ea65b9a7059caf10c0e171881ae6
        <input
          className="flex-1 rounded-xl border px-3 py-2 bg-background"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your website, colors, sections…"
<<<<<<< HEAD
=======
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
>>>>>>> bca90faad890ea65b9a7059caf10c0e171881ae6
        />
<<<<<<< HEAD
        <button onClick={send} className="rounded-xl px-4 py-2 bg-primary text-primary-foreground disabled:opacity-50" disabled={!input.trim()}>
=======
        <button
          onClick={send}
          className="rounded-xl px-4 py-2 bg-primary text-primary-foreground disabled:opacity-50"
          disabled={!input.trim()}
        >
>>>>>>> bca90faad890ea65b9a7059caf10c0e171881ae6
          Send
        </button>
      </div>
    </div>
  );
}
