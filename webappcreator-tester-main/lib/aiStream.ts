// lib/aiStream.ts
export type StreamLine =
  | { type: 'assistant'; delta: string }
  | { type: 'toolEvent'; event: any }
  | { type: 'error'; message: string }

export async function* streamChat(body: any) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buf = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    for (;;) {
      const nl = buf.indexOf('\n')
      if (nl === -1) break
      const line = buf.slice(0, nl).trim()
      buf = buf.slice(nl + 1)
      if (!line || line.startsWith(':ping')) continue
      yield JSON.parse(line) as StreamLine
    }
  }
}