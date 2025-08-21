export default function About({ heading, body, bullets }: { heading: string; body: string; bullets: string[] }) {
  return (
    <section className="px-6 py-16 md:py-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-2xl font-bold sm:text-3xl">{heading}</h2>
        <p className="mt-3 text-muted-foreground">{body}</p>
        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {bullets?.map((b, i) => (
            <li key={i} className="glass rounded-xl p-4">{b}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
