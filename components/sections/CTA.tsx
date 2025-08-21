
'use client'
import { Button } from '../ui'

export default function CTA({ heading, subheading, buttonLabel = 'Get started' }:
  { heading: string; subheading?: string; buttonLabel?: string }) {
  return (
    <section className="px-6 py-16 text-center">
      <h2 className="text-3xl font-extrabold">{heading}</h2>
      {subheading && <p className="text-muted-foreground mt-2">{subheading}</p>}
      <div className="mt-6"><Button>{buttonLabel}</Button></div>
    </section>
  )
}
