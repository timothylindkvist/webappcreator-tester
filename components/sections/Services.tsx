export default function Services({ items }: { items: { title: string; description: string }[] }) {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl font-bold sm:text-3xl">What we offer</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {items?.map((it, i) => (
            <div key={i} className="glass rounded-2xl p-5">
              <div className="text-lg font-semibold">{it.title}</div>
              <p className="mt-2 text-sm text-muted-foreground">{it.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
