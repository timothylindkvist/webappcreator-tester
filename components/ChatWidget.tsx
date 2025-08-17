
'use client';
import { useState } from 'react';
import { useBuilder } from '@/components/builder-context';

type Msg = { role: 'user' | 'assistant'; content: string };

export default function ChatWidget() {
  const { brief, setBrief, rebuild, applyTheme, addSection, removeSection, fixImages, applyStylePreset, setTypography, setDensity, patchSection, redesign } = useBuilder();
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: '👋 Describe how you want your website to be (business type, audience, tone, colors, sections)…' }
  ]);
  const [input, setInput] = useState('');

  async function send() {
    if (!input.trim()) return;
    const userMsg: Msg = { role: 'user', content: input.trim() };
    setMessages((cur) => [...cur, userMsg]);
    setInput('');

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [...messages, userMsg], state: { brief } }),
    });

    const reader = res.body?.getReader();
    if (!reader) return;

    // Insert a streaming assistant bubble
    const assistantIndex = messages.length + 1;
    setMessages((cur) => [...cur, { role: 'assistant', content: '' }]);

    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';

      for (const part of parts) {
        if (!part.trim()) continue;
        let json: any;
        try { json = JSON.parse(part); } catch { continue; }

        // Stream assistant narration
        if (json.type === 'assistant' && typeof json.delta === 'string') {
          setMessages((cur) => {
            const copy = [...cur];
            copy[assistantIndex] = { role: 'assistant', content: (copy[assistantIndex]?.content || '') + json.delta };
            return copy;
          });
        }

        // Handle tool events -> execute + inline confirmation
        if (json.type === 'tool' && typeof json.name === 'string') {
          const args = json.args || {};
          let confirm = '';
          switch (json.name) {
            case 'updateBrief':
              setBrief(args.brief);
              confirm = `\n\n📝 Updated brief.`;
              break;
            case 'rebuild':
              await rebuild();
              confirm = `\n\n🔄 Rebuilt the site.`;
              break;
            case 'setTheme': {
              const { brand, accent, background, foreground } = args;
              applyTheme({ brand, accent, background, foreground });
              const vibe = args.vibe ? ` (vibe: ${args.vibe})` : '';
              confirm = `\n\n🎨 Applied theme${vibe}.`;
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
              fixImages(args.section || 'fallback');
              confirm = `\n\n🖼️ Fixed images${args.section ? ' in “' + args.section + '”' : ''}.`;
              break;
            case 'applyStylePreset':
              applyStylePreset(args.preset);
              confirm = `\n\n🎭 Applied style preset “${args.preset}”.`;
              break;
            case 'setTypography':
              setTypography(args.font || args.heading, args.body || args.font);
              confirm = `\n\n🔤 Typography updated.`;
              break;
            case 'setDensity':
              setDensity(args.density);
              confirm = `\n\n📐 Density set to “${args.density}”.`;
              break;
            case 'patchSection':
              patchSection(args.section, args.content);
              confirm = `\n\n✏️ Updated “${args.section}”.`;
              break;
            case 'redesign':
              redesign(args.concept || args.directives);
              confirm = `\n\n✨ Redesigned site.`;
              break;
          }
          if (confirm) {
            setMessages((cur) => {
              const copy = [...cur];
              copy[assistantIndex] = { role: 'assistant', content: (copy[assistantIndex]?.content || '') + confirm };
              return copy;
            });
          }
        }
      }
    }
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-[70vh] flex flex-col bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
            <div className={'inline-block rounded-xl border border-border/60 px-3 py-2 text-sm whitespace-pre-wrap ' + (m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
              {m.content}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-border/60 p-2 flex gap-2 items-center">
        <input
          className="flex-1 rounded-xl border border-border/60 bg-transparent px-3 py-2 outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your website, colors, sections…"
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
  );
}
