
'use client'
import { Button, Card } from '../ui'

export default function Hero({ title, subtitle, cta }: { title: string; subtitle: string; cta?: { label: string } }) {
  return (
    <section className="px-6 py-16 md:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl">{title}</h1>
        <p className="mt-3 text-muted-foreground">{subtitle}</p>
        <div className="mt-6 flex justify-center gap-3">
          {cta?.label && <Button>{cta.label}</Button>}
          <Button className="bg-[var(--accent)]">Contact</Button>
        </div>
        <Card className="mx-auto mt-8 text-muted-foreground">This is a preview. Content updates live from the chat.</Card>
      </div>
    </section>
  )
}
