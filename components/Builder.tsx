
'use client'
import { useEffect } from 'react'
import { useSite } from '@/store/site'
import Hero from './sections/Hero'
import About from './sections/About'
import Features from './sections/Features'
import Gallery from './sections/Gallery'
import Testimonials from './sections/Testimonials'
import Pricing from './sections/Pricing'
import FAQ from './sections/FAQ'
import CTA from './sections/CTA'

export default function Builder() {
  const { theme, sections } = useSite()

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--brand', theme.palette.brand)
    root.style.setProperty('--accent', theme.palette.accent)
    root.style.setProperty('--background', theme.palette.background)
    root.style.setProperty('--foreground', theme.palette.foreground)
  }, [theme])

  return (
    <div className="space-y-10">
      {sections.hero && (
        <Hero {...sections.hero} />
      )}
      {sections.about && (
        <About {...sections.about} />
      )}
      {sections.features && (
        <Features {...sections.features} />
      )}
      {sections.gallery && (
        <Gallery {...sections.gallery} />
      )}
      {sections.testimonials && (
        <Testimonials {...sections.testimonials} />
      )}
      {sections.pricing && (
        <Pricing {...sections.pricing} />
      )}
      {sections.faq && (
        <FAQ {...sections.faq} />
      )}
      {sections.cta && (
        <CTA {...sections.cta} />
      )}
    </div>
  )
}
