'use client';

interface GalleryItem {
  title?: string;
  image?: string;
  src?: string;
  caption?: string;
  alt?: string;
}

interface GalleryProps {
  title?: string;
  items?: GalleryItem[];
  images?: GalleryItem[];
}

export default function Gallery({ title, items, images }: GalleryProps) {
  const entries = items ?? images ?? [];
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl font-bold sm:text-3xl">{title || 'Gallery'}</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {entries.map((it, i) => {
            const src = it.image ?? it.src;
            const caption = it.title ?? it.caption ?? it.alt;
            return (
              <figure key={i} className="group overflow-hidden rounded-2xl border border-border/60">
                {src && <img src={src} alt={caption ?? ''} className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                {caption && <figcaption className="p-3 text-sm text-muted-foreground">{caption}</figcaption>}
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
