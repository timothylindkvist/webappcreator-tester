'use client';

import EditableText from '../EditableText';

interface FAQProps {
  title?: string;
  items?: { q: string; a: string }[];
}

const card: React.CSSProperties = {
  border: '1px solid var(--border)',
  background: 'var(--card)',
  color: 'var(--card-foreground)',
};

export default function FAQ({ title, items = [] }: FAQProps) {
  return (
    <section className="px-6 py-12" style={{ color: 'var(--foreground)' }}>
      <EditableText path="faq.title" value={title || 'FAQ'} tag="h2" className="text-2xl font-bold" />
      <div className="mt-4 space-y-4">
        {items.map((it, i) => (
          <details key={i} className="rounded-xl p-4" style={card}>
            <summary className="cursor-pointer text-base font-semibold">
              <EditableText path={`faq.items.${i}.q`} value={it.q} tag="span" />
            </summary>
            <EditableText
              path={`faq.items.${i}.a`}
              value={it.a}
              tag="p"
              className="mt-2 text-sm"
              style={{ color: 'var(--muted)' }}
            />
          </details>
        ))}
      </div>
    </section>
  );
}
