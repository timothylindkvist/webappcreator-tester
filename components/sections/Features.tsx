'use client';

interface FeatureItem {
  title: string;
  body?: string;
  description?: string;
}

interface FeaturesProps {
  title?: string;
  items?: FeatureItem[];
}

const card: React.CSSProperties = {
  border: '1px solid var(--border)',
  background: 'var(--card)',
  color: 'var(--card-foreground)',
};

const muted: React.CSSProperties = { color: 'var(--muted)' };
const accent: React.CSSProperties = { color: 'var(--brand)' };

export default function Features({ title, items = [] }: FeaturesProps) {
  return (
    <section className="px-6 py-12" style={{ color: 'var(--foreground)' }}>
      <h2 className="text-2xl font-bold">{title || 'Features'}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {items.map((f, i) => (
          <div key={i} className="rounded-2xl p-5" style={card}>
            <div className="text-lg font-semibold" style={accent}>{f.title}</div>
            <p className="mt-2 text-sm" style={muted}>{f.description ?? f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
