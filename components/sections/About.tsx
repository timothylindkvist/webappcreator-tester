'use client';

import EditableText from '../EditableText';

interface AboutProps {
  heading?: string;
  body?: string;
  bullets?: string[];
}

const bulletCard: React.CSSProperties = {
  border: '1px solid var(--border)',
  background: 'var(--card)',
  color: 'var(--card-foreground)',
  backdropFilter: 'blur(12px)',
};

export default function About({ heading, body, bullets }: AboutProps) {
  return (
    <section className="px-6 py-16 md:py-20" style={{ color: 'var(--foreground)' }}>
      <div className="mx-auto max-w-4xl">
        {heading && (
          <EditableText path="about.heading" value={heading} tag="h2" className="text-2xl font-bold sm:text-3xl" />
        )}
        {body && (
          <EditableText path="about.body" value={body} tag="p" className="mt-3" style={{ color: 'var(--muted)' }} />
        )}
        {bullets && bullets.length > 0 && (
          <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {bullets.map((b, i) => (
              <li key={i} className="rounded-xl p-4" style={bulletCard}>
                <EditableText path={`about.bullets.${i}`} value={b} tag="span" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
