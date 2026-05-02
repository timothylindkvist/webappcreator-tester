'use client';

import EditableText from '../EditableText';

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
      <EditableText path="features.title" value={title || 'Features'} tag="h2" className="text-2xl font-bold" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {items.map((f, i) => (
          <div key={i} className="rounded-2xl p-5" style={card} data-sm-card="true">
            <EditableText
              path={`features.items.${i}.title`}
              value={f.title}
              tag="div"
              className="text-lg font-semibold"
              style={accent}
            />
            <EditableText
              path={`features.items.${i}.body`}
              value={f.description ?? f.body ?? ''}
              tag="p"
              className="mt-2 text-sm"
              style={muted}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
