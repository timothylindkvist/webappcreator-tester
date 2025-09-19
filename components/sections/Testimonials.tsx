export default function Testimonials({ quotes }: { quotes: { quote: string; author: string }[] }) {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-2xl font-bold sm:text-3xl">What partners say</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {quotes?.map((q, i) => (
            <blockquote key={i} className="glass rounded-2xl p-6 text-base">
              <p>“{q.quote}”</p>
              <footer className="mt-2 text-sm text-muted-foreground">— {q.author}</footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
