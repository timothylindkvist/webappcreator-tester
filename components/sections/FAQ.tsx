
'use client';
export default function FAQ({ items }: { items: { q: string; a: string }[] }) {
  return (
    <section className="px-6 py-12">
      <h2 className="text-2xl font-bold">FAQ</h2>
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
