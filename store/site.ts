// store/site.ts
import { create } from 'zustand'

export type SectionKey = 'hero'|'about'|'features'|'gallery'|'testimonials'|'pricing'|'faq'|'cta'
export type Theme = { brand:string; accent:string; background:string; foreground:string; vibe:string }

type SiteState = {
  theme: Theme | null
  sections: Partial<Record<SectionKey, any>>
  typography?: { font: string }
  density?: 'compact'|'cozy'|'comfortable'
  brief?: string
  apply: (fn: (s: SiteState) => void) => void
}

export const useSite = create<SiteState>((set) => ({
  theme: null,
  sections: {},
  apply: (fn) => set((s) => { fn(s) }),
}))