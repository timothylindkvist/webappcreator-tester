'use client';
import { useState } from 'react';
import { useBuilder } from '@/components/builder-context';

type Msg = { role: 'user' | 'assistant'; content: string };

export default function ChatWidget() {
  const { brief, setBrief, data, setData, applyTheme, addSection, removeSection, fixImages, applyStylePreset, setTypography, setDensity, patchSection, redesign, rebuild } = useBuilder();
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: '👋 I handle everything. Describe your website (business, audience, tone, colors, sections)…' }
  ]);
  const [input, setInput] = useState('');

  async function send() {
    if (!input.trim()) return;
    const userMsg: Msg = { role: 'user', content: input.trim() };
    setMessages(cur => [...cur, userMsg]);
    setInput('');

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [...messages, userMsg], state: { brief, data } }),
    });

    const reader = res.body?.getReader();
    if (!reader) return;

    // start streaming bubble
    const idx = messages.length + 1;
    setMessages(cur => [...cur, { role: 'assistant', content: '' }]);

    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // NDJSON: split by \n, ignore pings
      let lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        if (line.startsWith(':ping')) continue;

        let msg: any;
        try { msg = JSON.parse(line); } catch { continue; }

        if (msg.type === 'assistant' && typeof msg.delta === 'string') {
          setMessages(cur => {
            const copy = [...cur];
            copy[idx] = { role: 'assistant', content: (copy[idx]?.content || '') + msg.delta };
            return copy;
          });
        }

        if (msg.type === 'tool') {
          const args = msg.args || {};
          let confirm = '';

          switch (msg.name) {
            case 'updateBrief':
              setBrief(args.brief);
              confirm = `\n\n📝 Updated brief.`;
              break;
            case 'rebuild':
              await rebuild();
              confirm = `\n\n🔄 Rebuilt the site.`;
              break;
            case 'setTheme': {
              const { brand, accent, background, foreground, vibe } = args;
              applyTheme({ brand, accent, background, foreground, vibe });
              confirm = `\n\n🎨 Applied theme${vibe ? ` (${vibe})` : ''}.`;
              break;
            }
            case 'addSection':
              addSection(args.section, args.payload);
              confirm = `\n\n➕ Added section “${args.section}”.`;
              break;
            case 'removeSection':
              removeSection(args.section);
              confirm = `\n\n➖ Removed section “${args.section}”.`;
              break;
            case 'fixImages':
              fixImages(args.section);
              confirm = `\n\n🖼️ Fixed images${args.section ? ` in “${args.section}”` : ''}.`;
              break;
            case 'applyStylePreset':
              applyStylePreset(args.preset);
              confirm = `\n\n🎭 Applied style preset “${args.preset}”.`;
              break;
            case 'setTypography':
              setTypography(args.font);
              confirm = `\n\n🔤 Typography → ${args.font}.`;
              break;
            case 'setDensity':
              setDensity(args.density);
              confirm = `\n\n📐 Density → ${args.density}.`;
              break;
            case 'patchSection':
              patchSection(args.section, args.content);
              confirm = `\n\n✏️ Updated “${args.section}”.`;
              break;
            case 'redesign':
              redesign(args.concept);
              confirm = `\n\n✨ Redesigned layout.`;
              break;
            case 'setSiteData':
              setData(args); // replace entire object
              confirm = `\n\n🧩 Applied full site structure.`;
              break;
          }

          if (confirm) {
            setMessages(cur => {
              const copy = [...cur];
              copy[idx] = { role: 'assistant', content: (copy[idx]?.content || '') + confirm };
              return copy;
            });
          }
        }

        if (msg.type === 'error') {
          setMessages(cur => {
            const copy = [...cur];
            copy[idx] = { role: 'assistant', content: (copy[idx]?.content || '') + `\n\n⚠️ ${msg.message}` };
            return copy;
          });
        }
      }
    }
  }

  return (
    <div className="h-full flex flex-col bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
            <div className={'inline-block max-w-[85%] whitespace-pre-wrap rounded-xl border px-3 py-2 text-sm ' + (m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
              {m.content}
            </div>
          </div>
        ))}
      </div>
      <div className="p-2 border-t flex gap-2">
        <input
          className="flex-1 rounded-xl border px-3 py-2 bg-background"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your website, colors, sections…"
        />
        <button onClick={send} className="rounded-xl px-4 py-2 bg-primary text-primary-foreground disabled:opacity-50" disabled={!input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}
