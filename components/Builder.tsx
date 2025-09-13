'use client';
import { useEffect } from 'react';
import { useBuilder } from './builder-context';

export default function Builder() {
  const { data } = useBuilder();

  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty('--brand', data.theme.palette.brand);
    r.style.setProperty('--accent', data.theme.palette.accent);
    r.style.setProperty('--background', data.theme.palette.background);
    r.style.setProperty('--foreground', data.theme.palette.foreground);
  }, [data.theme]);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <section className="card" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
        <h1 style={{ margin: 0, color: 'var(--brand)' }}>{data.hero?.title}</h1>
        <p style={{ marginTop: 8, opacity: 0.8 }}>{data.hero?.subtitle}</p>
      </section>

      {data.about && (
        <section className="card">
          <h2 style={{ marginTop: 0 }}>{data.about.heading}</h2>
          <p style={{ opacity: 0.8 }}>{data.about.body}</p>
        </section>
      )}

      {data.features?.items?.length ? (
        <section className="card">
          <h2 style={{ marginTop: 0 }}>{data.features.title || 'Features'}</h2>
          <ul style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', paddingLeft: 16 }}>
            {data.features.items.map((it, i) => (
              <li key={i} className="card">
                <div style={{ fontWeight: 600 }}>{it.title}</div>
                <div style={{ opacity: 0.8 }}>{it.body}</div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.pricing?.plans?.length ? (
        <section className="card">
          <h2 style={{ marginTop: 0 }}>{data.pricing.title || 'Pricing'}</h2>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {data.pricing.plans.map((p, i) => (
              <div key={i} className="card">
                <div style={{ fontSize: 18, fontWeight: 600 }}>{p.name}</div>
                <div style={{ opacity: 0.8 }}>{p.price}</div>
                <ul style={{ marginTop: 8, opacity: 0.8 }}>
                  {(p.features || []).map((f, j) => <li key={j}>{f}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
