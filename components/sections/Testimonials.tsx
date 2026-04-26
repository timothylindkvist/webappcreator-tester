'use client';

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
  return (
    <section className="px-6 py-16" style={{ color: 'var(--foreground)' }}>
      <div className="mx-auto max-w-5xl">
        <h2 className="text-2xl font-bold sm:text-3xl">{title || 'What people say'}</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {entries.map((q, i) => (
            <blockquote key={i} className="rounded-2xl p-6 text-base" style={card}>
              <p>"{q.quote}"</p>
              {q.author && (
                <footer className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>— {q.author}</footer>
              )}
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
