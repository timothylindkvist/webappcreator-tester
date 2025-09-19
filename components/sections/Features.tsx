
'use client';
export default function Features({ items }: { items: { title: string; description: string }[] }) {
  return (
    <section className="px-6 py-12">
      <h2 className="text-2xl font-bold">Features</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {items.map((f, i) => (
          <div key={i} className="rounded-2xl border border-border/60 p-5">
            <div className="text-lg font-semibold">{f.title}</div>
            <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
