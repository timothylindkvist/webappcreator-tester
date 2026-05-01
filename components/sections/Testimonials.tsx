'use client';

import EditableText from '../EditableText';

interface Quote {
  quote: string;
  author?: string;
}

interface TestimonialsProps {
  title?: string;
  quotes?: Quote[];
  items?: Quote[];
}

const card: React.CSSProperties = {
  border: '1px solid var(--border)',
  background: 'var(--card)',
  color: 'var(--card-foreground)',
  backdropFilter: 'blur(12px)',
};

export default function Testimonials({ title, quotes, items }: TestimonialsProps) {
  const entries = quotes ?? items ?? [];
  const listKey = quotes !== undefined ? 'quotes' : 'items';

  return (
    <section className="px-6 py-16" style={{ color: 'var(--foreground)' }}>
      <div className="mx-auto max-w-5xl">
        <EditableText
          path="testimonials.title"
          value={title || 'What people say'}
          tag="h2"
          className="text-2xl font-bold sm:text-3xl"
        />
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {entries.map((q, i) => (
            <blockquote key={i} className="rounded-2xl p-6 text-base" style={card}>
              <p>"<EditableText path={`testimonials.${listKey}.${i}.quote`} value={q.quote} tag="span" />"</p>
              {q.author && (
                <footer className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
                  — <EditableText path={`testimonials.${listKey}.${i}.author`} value={q.author} tag="span" />
                </footer>
              )}
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
