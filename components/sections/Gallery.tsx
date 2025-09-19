export default function Gallery({ items }: { items: { title: string; image: string }[] }) {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl font-bold sm:text-3xl">Featured Work</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {items?.map((it, i) => (
            <figure key={i} className="group overflow-hidden rounded-2xl border border-border/60">
              <img src={it.image} alt="" className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"/>
              <figcaption className="p-3 text-sm text-muted-foreground">{it.title}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
