'use client';

interface FAQProps {
  title?: string;
  items?: { q: string; a: string }[];
}

export default function FAQ({ title, items = [] }: FAQProps) {
  return (
    <section className="px-6 py-12">
      <h2 className="text-2xl font-bold">{title || 'FAQ'}</h2>
      <div className="mt-4 space-y-4">
        {items.map((it, i) => (
          <details key={i} className="rounded-xl border border-border/60 p-4">
            <summary className="cursor-pointer text-base font-semibold">{it.q}</summary>
            <p className="mt-2 text-sm text-muted-foreground">{it.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
