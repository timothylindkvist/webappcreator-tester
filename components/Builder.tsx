'use client';
import { useEffect } from 'react';
import { useBuilder } from '@/components/builder-context';

// Accept items that may have either `description` or `body`
function featureText(it: { title: string; body?: string } & Record<string, unknown>) {
  const desc = (it as any)?.description;
  if (typeof desc === 'string' && desc.length) return desc;
  return it.body ?? '';
}

// Some plans use `includes`, others `features`
function planFeatures(
  p: { features?: string[] } & Record<string, unknown>
): string[] {
  const inc = (p as any)?.includes;
  if (Array.isArray(inc)) return inc as string[];
  return p.features ?? [];
}

export default function Builder() {
  const { data } = useBuilder();
  // apply CSS vars for theme palette
  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty('--brand', data.theme.palette.brand);
    r.style.setProperty('--accent', data.theme.palette.accent);
    r.style.setProperty('--background', data.theme.palette.background);
    r.style.setProperty('--foreground', data.theme.palette.foreground);
  }, [data.theme]);

  return (
    <div className="space-y-8">
      <section className="p-8 rounded-2xl bg-card border border-border">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--brand)' }}>{data.hero?.title}</h1>
        <p className="mt-2 text-muted-foreground">{data.hero?.subtitle}</p>
      </section>

      {data.about && (
        <section className="p-6 rounded-2xl bg-card border border-border">
          <h2 className="text-xl font-semibold">{data.about.heading}</h2>
          <p className="mt-2 text-muted-foreground">{data.about.body}</p>
        </section>
      )}

      {data.features && (
        <section className="p-6 rounded-2xl bg-card border border-border">
          <h2 className="text-xl font-semibold">{data.features.title || 'Features'}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {(data.features.items || []).map((it, i) => (
              <div key={i} className="rounded-xl border p-4 bg-muted">
                <div className="font-medium">{it.title}</div>
                <div className="text-sm text-muted-foreground">{featureText(it)}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.gallery && (
        <section className="p-6 rounded-2xl bg-card border border-border">
          <h2 className="text-xl font-semibold">{data.gallery.title || 'Gallery'}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {(data.gallery.images || []).map((img, i) => (
              <div key={i} className="aspect-video rounded-xl bg-muted border flex items-center justify-center text-xs text-muted-foreground">
                {img.alt || 'Image'}
              </div>
            ))}
          </div>
        </section>
      )}

      {data.testimonials && (
        <section className="p-6 rounded-2xl bg-card border border-border">
          <h2 className="text-xl font-semibold">{data.testimonials.title || 'Testimonials'}</h2>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            {(data.testimonials.items || []).map((t, i) => (
              <div key={i} className="rounded-xl border p-4 bg-muted">
                <div className="italic">“{t.quote}”</div>
                <div className="text-sm text-muted-foreground mt-2">— {t.author || 'Anonymous'}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.pricing && (
        <section className="p-6 rounded-2xl bg-card border border-border">
          <h2 className="text-xl font-semibold">{data.pricing.title || 'Pricing'}</h2>
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            {(data.pricing.plans || []).map((p, i) => (
              <div key={i} className="rounded-xl border p-4 bg-muted">
                <div className="font-semibold">{p.name}</div>
                <ul className="text-sm text-muted-foreground list-disc ml-5 space-y-1">
                    {planFeatures(p).map((f, j) => <li key={j}>{f}</li>)}
</ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
