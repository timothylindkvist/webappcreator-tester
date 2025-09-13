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
    <div className="space-y-8">
      <section className="p-8 rounded-2xl border" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--brand)' }}>{data.hero?.title}</h1>
        <p className="mt-2 opacity-80">{data.hero?.subtitle}</p>
      </section>

      {data.about && (
        <section className="p-6 rounded-2xl border">
          <h2 className="text-xl font-semibold">{data.about.heading}</h2>
          <p className="mt-2 opacity-80">{data.about.body}</p>
        </section>
      )}

      {data.features?.items?.length ? (
        <section className="p-6 rounded-2xl border">
          <h2 className="text-xl font-semibold">{data.features.title || 'Features'}</h2>
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {data.features.items.map((it, i) => (
              <li key={i} className="p-4 rounded-xl border">
                <div className="font-medium">{it.title}</div>
                <div className="opacity-80">{it.body}</div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.pricing?.plans?.length ? (
        <section className="p-6 rounded-2xl border">
          <h2 className="text-xl font-semibold">{data.pricing.title || 'Pricing'}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {data.pricing.plans.map((p, i) => (
              <div key={i} className="p-4 rounded-xl border">
                <div className="text-lg font-semibold">{p.name}</div>
                <div className="opacity-80">{p.price}</div>
                <ul className="mt-3 list-disc list-inside opacity-80">
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
