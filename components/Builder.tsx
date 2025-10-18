'use client';
import { useEffect } from 'react';
import Game from './sections/Game';
import Html from './sections/Html';
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


  // Render ordered blocks if present
  const blocks = (data as any).blocks as Array<{ id: string; type: string; data?: any }> | undefined;
  if (Array.isArray(blocks) && blocks.length) {
    const Map: Record<string, React.ComponentType<any>> = {
      hero: require('./sections/Hero').default,
      about: require('./sections/About').default,
      features: require('./sections/Features').default,
      gallery: require('./sections/Gallery').default,
      testimonials: require('./sections/Testimonials').default,
      pricing: require('./sections/Pricing').default,
      faq: require('./sections/FAQ').default,
      cta: require('./sections/CTA').default,
      game: require('./sections/Game').default,
      html: require('./sections/Html').default,
    };
    return (
      <div>
        {blocks.map((b) => {
          const Comp = Map[b.type];
          if (!Comp) return null;
          return <Comp key={b.id} {...(b.data || {})} />;
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {(data.hero?.title || data.hero?.subtitle) ? (
        <section className="rounded-2xl border border-muted p-8 bg-[var(--background)] text-[var(--foreground)]">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--brand)]">{data.hero?.title}</h1>
          <p className="mt-2 subtitle">{data.hero?.subtitle}</p>
        </section>
      ) : null}

      {data.about && (
        <section className="card">
          <h2 className="text-xl font-semibold">{data.about.heading}</h2>
          <p className="mt-2 muted">{data.about.body}</p>
        </section>
      )}

      {data.features?.items?.length ? (
        <section className="card">
          <h2 className="text-xl font-semibold">{data.features.title || 'Features'}</h2>
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {data.features.items.map((it, i) => (
              <li key={i} className="border border-muted rounded-xl p-4">
                <div className="font-medium">{it.title}</div>
                <div className="muted">{it.body}</div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.pricing?.plans?.length ? (
        <section className="card">
          <h2 className="text-xl font-semibold">{data.pricing.title || 'Pricing'}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {data.pricing.plans.map((p, i) => (
              <div key={i} className="border border-muted rounded-xl p-4">
                <div className="text-lg font-semibold">{p.name}</div>
                <div className="muted">{p.price}</div>
                <ul className="mt-3 list-disc list-inside muted space-y-1">
                  {(p.features || []).map((f, j) => <li key={j}>{f}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      {(data as any).game ? <Game {...(data as any).game} /> : null}
      {(data as any).html ? <Html html={(data as any).html?.content || (data as any).html || ''} /> : null}
      {(data as any).history ? (
        <section className="card">
          <h2 className="section-title">{(data as any).history?.title || 'Our History'}</h2>
          <div className="prose muted">{(data as any).history?.body}</div>
        </section>
      ) : null}

      {data.faq ? (
        <section className="card">
          <h2 className="section-title">{data.faq.title || 'FAQ'}</h2>
          <div className="space-y-3">
            {(data.faq.items || []).map((it, i) => (
              <details key={i} className="rounded-xl border p-3">
                <summary className="font-medium cursor-pointer">{it.q || `Question ${i + 1}`}</summary>
                {it.a ? <p className="mt-2 prose muted">{it.a}</p> : null}
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {/* catch-all: render any unknown sections the model created */}
      {Object.entries(data as any).map(([key, val]) => {
        const KNOWN = new Set([
          'theme','brand','hero','about','features','gallery','testimonials','pricing','faq','cta','game','history','html'
        ]);
        if (KNOWN.has(key)) return null;
        if (!val || typeof val !== 'object') return null;
        const title = (val as any).title || (val as any).heading || key.charAt(0).toUpperCase() + key.slice(1);
        const body = (val as any).body || (val as any).description || (val as any).text;
        const items = Array.isArray((val as any).items) ? (val as any).items : null;
        return (
          <section key={key} className="card">
            <h2 className="section-title">{title}</h2>
            {body ? <div className="prose muted">{body}</div> : null}
            {items ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((it: any, i: number) => (
                  <div key={i} className="rounded-xl border p-4">
                    <div className="font-medium">{it.title || it.name || `Item ${i + 1}`}</div>
                    {it.body || it.description ? <p className="muted">{it.body || it.description}</p> : null}
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
