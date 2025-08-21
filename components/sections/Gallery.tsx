
'use client'
export default function Gallery({ images = [] as { url: string; caption?: string }[] }: { images?: { url: string; caption?: string }[] }) {
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-2xl font-bold sm:text-3xl">Gallery</h2>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((im, i) => (
            <figure key={i} className="overflow-hidden rounded-xl border border-white/10">
              <img src={im.url} alt={im.caption || ''} className="w-full h-40 object-cover" />
              {im.caption && <figcaption className="text-xs text-muted-foreground p-2">{im.caption}</figcaption>}
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
