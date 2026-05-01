'use client';

import { useEffect, useRef, useState } from 'react';
import { useBuilder } from './builder-context';
import { useEditMode } from './EditModeContext';
import { streamChat } from '@/lib/aiStream';

type Msg = { role: 'user' | 'assistant'; content: string };
type CreationStep = 'idle' | 'clarifying' | 'generating-brief' | 'briefing' | 'live';
type Answers = Partial<Record<'style' | 'audience' | 'goal' | 'theme' | 'gallery', string>>;

const EXAMPLES = [
  'A landing page for an artisan coffee shop in Brooklyn',
  'A sleek SaaS product page for a project management tool',
  'A portfolio site for a freelance photographer',
  'A modern gym website with pricing and class schedule',
];

const COLOR_PRESETS = [
  { name: 'Purple', brand: '#7c3aed', accent: '#06b6d4' },
  { name: 'Coral', brand: '#e05252', accent: '#f97316' },
  { name: 'Blue', brand: '#2563eb', accent: '#0ea5e9' },
  { name: 'Green', brand: '#16a34a', accent: '#10b981' },
  { name: 'Slate', brand: '#334155', accent: '#64748b' },
];

const QUESTIONS: Array<{ key: keyof Answers; label: string; options: string[] }> = [
  {
    key: 'style',
    label: 'Overall style',
    options: ['Professional & corporate', 'Creative & playful', 'Minimal & clean', 'Bold & energetic'],
  },
  {
    key: 'audience',
    label: 'Target audience',
    options: ['B2B / Enterprise', 'Consumers / B2C', 'Professionals & specialists', 'General public'],
  },
  {
    key: 'goal',
    label: 'Primary goal',
    options: ['Generate leads', 'Sell products', 'Build credibility', 'Share information'],
  },
  {
    key: 'theme',
    label: 'Colour theme',
    options: ['Light', 'Dark', 'Vibrant & colourful', 'Auto-select'],
  },
  {
    key: 'gallery',
    label: 'Gallery section',
    options: ['Yes, use real photos', 'No, use icons & patterns', 'No gallery needed'],
  },
];

function autoDetectAnswers(desc: string): Answers {
  const d = desc.toLowerCase();
  const answers: Answers = {};

  // Style
  if (/\b(gym|fitness|sport|energy|energetic|bold|powerful|dynamic)\b/.test(d)) answers.style = 'Bold & energetic';
  else if (/\b(portfolio|photographer|artist|creative|studio|illustration)\b/.test(d)) answers.style = 'Creative & playful';
  else if (/\b(professional|corporate|b2b|enterprise|law|finance|medical|clinic)\b/.test(d)) answers.style = 'Professional & corporate';
  else if (/\b(minimal|clean|simple|zen|elegant|pure)\b/.test(d)) answers.style = 'Minimal & clean';

  // Audience
  if (/\b(b2b|enterprise|corporate|saas|software|platform|agency)\b/.test(d)) answers.audience = 'B2B / Enterprise';
  else if (/\b(consumer|retail|shop|store|ecommerce|e-commerce)\b/.test(d)) answers.audience = 'Consumers / B2C';
  else if (/\b(freelance|consultant|specialist|expert|professional)\b/.test(d)) answers.audience = 'Professionals & specialists';

  // Goal
  if (/\b(shop|store|buy|sell|product|ecommerce|e-commerce|purchase)\b/.test(d)) answers.goal = 'Sell products';
  else if (/\b(portfolio|showcase|credibility|trust|reputation)\b/.test(d)) answers.goal = 'Build credibility';
  else if (/\b(blog|news|article|information|content|magazine)\b/.test(d)) answers.goal = 'Share information';
  else if (/\b(lead|signup|demo|trial|startup|saas|get started)\b/.test(d)) answers.goal = 'Generate leads';

  // Theme
  if (/\b(dark|night|black|moody|dramatic)\b/.test(d)) answers.theme = 'Dark';
  else if (/\b(light|white|bright|airy)\b/.test(d)) answers.theme = 'Light';
  else if (/\b(vibrant|colorful|colourful)\b/.test(d)) answers.theme = 'Vibrant & colourful';

  // Gallery
  if (/\b(restaurant|cafe|coffee|food|photo|photographer|photography|portfolio|real estate|hotel|resort|ski|travel|retail|shop|gallery)\b/.test(d)) {
    answers.gallery = 'Yes, use real photos';
  } else if (/\b(saas|software|platform|finance|investment|law|legal|consulting|agency|startup|app|service|b2b)\b/.test(d)) {
    answers.gallery = 'No, use icons & patterns';
  }

  return answers;
}

function BotIcon() {
  return (
    <div className="w-6 h-6 rounded-full bg-[#ede9fe] flex-shrink-0 flex items-center justify-center">
      <svg className="w-3 h-3 text-[#7c3aed]" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
      </svg>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2">
      <BotIcon />
      <div className="bg-white border border-zinc-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-3.5">
          {[0, 150, 300].map((delay) => (
            <span key={delay} className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ClarifyingQuestions({
  answers,
  onChange,
  onContinue,
  onSkip,
  busy,
}: {
  answers: Answers;
  onChange: (key: keyof Answers, value: string) => void;
  onContinue: () => void;
  onSkip: () => void;
  busy: boolean;
}) {
  const allAnswered = QUESTIONS.every((q) => !!answers[q.key]);
  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-[#ede9fe] flex items-center justify-center flex-shrink-0">
          <svg className="w-2.5 h-2.5 text-[#7c3aed]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        </div>
        <p className="text-[12px] font-semibold text-zinc-600">A few quick questions to shape your site</p>
      </div>

      {QUESTIONS.map((q) => (
        <div key={q.key}>
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">{q.label}</p>
          <div className="flex flex-wrap gap-1.5">
            {q.options.map((opt) => (
              <button
                key={opt}
                disabled={busy}
                onClick={() => onChange(q.key, opt)}
                className={`px-2.5 py-1 rounded-full text-[11px] border transition-all ${
                  answers[q.key] === opt
                    ? 'bg-[#7c3aed] text-white border-[#7c3aed] font-medium'
                    : 'bg-white text-zinc-500 border-zinc-200 hover:border-[#7c3aed]/40 hover:text-zinc-700'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="flex gap-2 pt-1">
        <button
          disabled={!allAnswered || busy}
          onClick={onContinue}
          className="flex-1 rounded-xl bg-[#7c3aed] py-2.5 text-[13px] font-semibold text-white disabled:opacity-40"
        >
          Preview brief →
        </button>
        <button
          disabled={busy}
          onClick={onSkip}
          className="rounded-xl border border-zinc-200 px-4 py-2.5 text-[12px] text-zinc-500 hover:bg-zinc-50 disabled:opacity-50"
        >
          Skip
        </button>
      </div>
    </div>
  );
}

function BriefEditor({
  briefText,
  onChange,
  onGenerate,
  onBack,
  busy,
}: {
  briefText: string;
  onChange: (val: string) => void;
  onGenerate: () => void;
  onBack: () => void;
  busy: boolean;
}) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-[#ede9fe] flex items-center justify-center flex-shrink-0">
          <svg className="w-2.5 h-2.5 text-[#7c3aed]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <p className="text-[12px] font-semibold text-zinc-600">Design brief — edit if you'd like</p>
      </div>
      <textarea
        value={briefText}
        onChange={(e) => onChange(e.target.value)}
        rows={7}
        className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-[12px] leading-relaxed text-zinc-700 outline-none transition-colors focus:border-[#7c3aed]/50 focus:bg-white"
      />
      <div className="flex gap-2">
        <button
          disabled={busy}
          onClick={onGenerate}
          className="flex-1 rounded-xl bg-[#7c3aed] py-2.5 text-[13px] font-semibold text-white disabled:opacity-50"
        >
          {busy ? 'Building your site…' : 'Generate website →'}
        </button>
        <button
          disabled={busy}
          onClick={onBack}
          className="rounded-xl border border-zinc-200 px-4 py-2.5 text-[13px] text-zinc-500 hover:bg-zinc-50 disabled:opacity-50"
        >
          Back
        </button>
      </div>
    </div>
  );
}

export default function ChatWidget() {
  const { data, brief, setBrief, rebuild, siteId, setSiteId, applyTheme } = useBuilder();
  const { isEditMode, toggleEditMode, hasChanges, reapplyOverrides } = useEditMode();
  const [step, setStep] = useState<CreationStep>('idle');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [briefText, setBriefText] = useState('');
  const [answers, setAnswers] = useState<Answers>({});
  const [originalDesc, setOriginalDesc] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasContent = !!(data.hero?.title);
  useEffect(() => {
    if (hasContent && step === 'idle') setStep('live');
  }, [hasContent]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, step, busy]);

  const persistLatestSite = async (currentSiteId: string | null) => {
    try {
      const latest = (window as any).__sidesmithTools?.getSiteData?.() || data;
      const res = await fetch('/api/builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site: latest, brief, id: currentSiteId }),
      });
      const json = await res.json();
      if (json.ok && json.id && json.id !== currentSiteId) {
        setSiteId(json.id);
        window.history.replaceState(null, '', `?site=${json.id}`);
      }
    } catch { /* non-critical */ }
  };

  const resetTextarea = () => {
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  // Step 1: show clarifying questions immediately
  const startCreationFlow = (desc: string) => {
    setMessages([{ role: 'user', content: desc }]);
    setInput('');
    resetTextarea();
    setOriginalDesc(desc);
    setAnswers(autoDetectAnswers(desc));
    setStep('clarifying');
  };

  // Step 2: fetch brief with optional answers
  const submitClarifying = async (withAnswers: boolean) => {
    setBusy(true);
    setStep('generating-brief');
    try {
      const body: Record<string, unknown> = { description: originalDesc };
      if (withAnswers) body.answers = answers;
      const res = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.ok && json.brief) {
        setBriefText(json.brief);
        setMessages((cur) => [
          ...cur,
          { role: 'assistant', content: "Here's a design brief based on your idea. Edit it if you'd like, then generate your site." },
        ]);
        setStep('briefing');
      } else {
        await doGenerate(originalDesc);
      }
    } catch {
      await doGenerate(originalDesc);
    } finally {
      setBusy(false);
    }
  };

  // Direct generate without brief (fallback)
  const doGenerate = async (briefOverride?: string) => {
    const baseBrief = briefOverride ?? briefText;
    setBrief(baseBrief);

    // Append gallery directive so Claude respects the user's photo choice
    let effectiveBrief = baseBrief;
    if (answers.gallery === 'No gallery needed') {
      effectiveBrief += '\n[Do NOT include a gallery section in this site.]';
    } else if (answers.gallery === 'No, use icons & patterns') {
      effectiveBrief += '\n[Gallery must use icon-cards, feature-cards, or color-blocks — no photos.]';
    }

    try {
      await rebuild(effectiveBrief);
      setMessages((cur) => [
        ...cur,
        { role: 'assistant', content: "Your site is ready! Tell me what you'd like to change." },
      ]);
      setStep('live');
      await persistLatestSite(null);
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setStep('idle');
    }
  };

  // Step 3: generate from brief editor
  const generateFromBrief = async () => {
    setBusy(true);
    setError(null);
    await doGenerate(briefText);
    setBusy(false);
  };

  // Chat after site is live
  const sendChat = async (msg: string) => {
    const nextMessages: Msg[] = [...messages, { role: 'user', content: msg }];
    setMessages(nextMessages);
    setInput('');
    resetTextarea();
    setBusy(true);
    try {
      const res = await streamChat(nextMessages, { site: data, brief });
      setMessages((cur) => [...cur, { role: 'assistant', content: res.reply || 'Done.' }]);
      // Re-apply any inline edits on top of the AI's changes
      if (hasChanges) reapplyOverrides();
      await persistLatestSite(siteId);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || busy) return;
    setError(null);
    if (step === 'idle') { startCreationFlow(msg); return; }
    if (step === 'live') { await sendChat(msg); }
  };

  const isLive = step === 'live';

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#f8f8fb]">
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-4 pb-3.5 border-b border-zinc-200/70">
        <p className="text-[13px] font-medium text-zinc-500">
          {isLive ? 'What would you like to change?' : 'Describe the site you want to build'}
        </p>
      </div>

      {/* Colour theme + edit mode toggle — live only */}
      {isLive && (
        <div className="flex-shrink-0 px-5 py-3 border-b border-zinc-100 flex items-center gap-2.5">
          <span className="text-[11px] font-medium text-zinc-400 tracking-wide">Colour</span>
          <div className="flex gap-2 ml-1 flex-1">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.name}
                title={preset.name}
                onClick={() =>
                  applyTheme({
                    palette: {
                      brand: preset.brand,
                      accent: preset.accent,
                      background: data.theme.palette.background,
                      foreground: data.theme.palette.foreground,
                    },
                  })
                }
                className="w-[18px] h-[18px] rounded-full transition-transform hover:scale-110 active:scale-95"
                style={{
                  backgroundColor: preset.brand,
                  outline: data.theme.palette.brand === preset.brand ? `2px solid ${preset.brand}` : 'none',
                  outlineOffset: '2px',
                }}
              />
            ))}
          </div>
          <button
            onClick={toggleEditMode}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all flex-shrink-0 ${
              isEditMode
                ? 'bg-[#7c3aed] text-white'
                : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            {isEditMode ? (
              <>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Done editing
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                Edit content
              </>
            )}
          </button>
        </div>
      )}

      {/* Messages + interactive steps */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {/* Example prompts — idle only */}
        {step === 'idle' && messages.length === 0 && (
          <div className="space-y-2 pt-1">
            <p className="text-[11px] text-zinc-400 text-center pb-1">Try an example</p>
            {EXAMPLES.map((example) => (
              <button
                key={example}
                className="w-full text-left px-3.5 py-3 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300 text-[12px] text-zinc-500 hover:text-zinc-700 transition-all shadow-sm"
                onClick={() => void send(example)}
                disabled={busy}
              >
                {example}
              </button>
            ))}
          </div>
        )}

        {/* Chat history */}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {message.role === 'assistant' && <BotIcon />}
            <div
              className={
                message.role === 'user'
                  ? 'bg-[#ede9fe] text-[#3b0764] rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-[13px] max-w-[88%] leading-relaxed'
                  : 'bg-white text-zinc-700 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-[13px] max-w-[88%] leading-relaxed border border-zinc-100 shadow-sm'
              }
            >
              {message.content}
            </div>
          </div>
        ))}

        {/* Clarifying questions */}
        {step === 'clarifying' && (
          <ClarifyingQuestions
            answers={answers}
            onChange={(key, val) => setAnswers((cur) => ({ ...cur, [key]: val }))}
            onContinue={() => void submitClarifying(true)}
            onSkip={() => void submitClarifying(false)}
            busy={busy}
          />
        )}

        {/* Brief generation spinner */}
        {step === 'generating-brief' && busy && (
          <div className="flex items-start gap-2">
            <BotIcon />
            <div className="bg-white border border-zinc-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 text-[13px] text-zinc-500">
              Crafting your design brief…
            </div>
          </div>
        )}

        {/* Brief editor */}
        {step === 'briefing' && (
          <BriefEditor
            briefText={briefText}
            onChange={setBriefText}
            onGenerate={generateFromBrief}
            onBack={() => setStep('clarifying')}
            busy={busy}
          />
        )}

        {busy && step === 'live' && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-[12px] text-red-700 flex-shrink-0 space-y-1">
          <p className="font-medium">Something went wrong — please try again.</p>
          <p className="text-red-500 font-mono text-[10px] break-all leading-relaxed">{error}</p>
        </div>
      )}

      {/* Input — idle and live only */}
      {(step === 'idle' || step === 'live') && (
        <div className="flex-shrink-0 p-4 pt-3 border-t border-zinc-200/70 bg-white">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              rows={1}
              className="flex-1 bg-[#f8f8fb] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-[13px] text-zinc-800 placeholder-zinc-400 outline-none focus:border-[#8B5CF6]/60 focus:bg-white transition-all resize-none leading-relaxed overflow-hidden"
              style={{ minHeight: '42px', maxHeight: '120px' }}
              disabled={busy}
              placeholder={isLive ? 'Ask for a change…' : 'Describe what to build…'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = 'auto';
                t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <button
              className="flex-shrink-0 w-[42px] h-[42px] rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-sm"
              disabled={busy || !input.trim()}
              onClick={() => void send()}
              aria-label="Send"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
