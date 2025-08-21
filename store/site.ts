// store/site.ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export type SectionKey =
  | 'hero'
  | 'about'
  | 'features'
  | 'gallery'
  | 'testimonials'
  | 'pricing'
  | 'faq'
  | 'cta'

export type Theme = {
  brand: string
  accent: string
  background: string
  foreground: string
  vibe: string
}

export type SiteState = {
  theme: Theme | null
  sections: Partial<Record<SectionKey, any>>
  typography?: { font: string }
  density?: 'compact' | 'cozy' | 'comfortable'
  brief?: string
  apply: (fn: (s: SiteState) => void) => void
}

export const useSite = create<SiteState>()(
  immer((set) => ({
    theme: null,
    sections: {},
    // With immer, this receives a *draft* you can mutate
    apply: (fn) => set(fn),
  }))
)