
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
  vibe?: string
  palette: {
    brand: string
    accent: string
    background: string
    foreground: string
  }
  typography?: { font?: string; headings?: string }
  density?: 'compact' | 'cozy' | 'comfortable'
}

export type Sections = Partial<Record<SectionKey, any>>

export type SiteState = {
  brief: string
  theme: Theme
  sections: Sections

  // actions
  setBrief: (b: string) => void
  setData: (d: { theme?: Theme; sections?: Sections }) => void
  applyTheme: (t: Partial<Theme>) => void
  addSection: (section: SectionKey, data: any) => void
  removeSection: (section: SectionKey) => void
  fixImages: () => void
  redesign: (concept?: string) => void
  rebuild: () => Promise<void>
}

const initial: Pick<SiteState, 'brief' | 'theme' | 'sections'> = {
  brief: '',
  theme: {
    palette: {
      brand: '#6D28D9',
      accent: '#0EA5E9',
      background: '#0b0b0d',
      foreground: '#f6f7fb'
    },
    typography: { font: 'Inter, ui-sans-serif, system-ui', headings: 'Poppins, ui-sans-serif' },
    density: 'comfortable'
  },
  sections: {},
}

export const useSite = create<SiteState>()(
  immer((set, get) => ({
    ...initial,
    setBrief: (b) => set((s) => { s.brief = b }),
    setData: (d) =>
      set((s) => {
        if (d.theme) s.theme = { ...s.theme, ...d.theme }
        if (d.sections) s.sections = { ...s.sections, ...d.sections }
      }),
    applyTheme: (t) => set((s) => { s.theme = { ...s.theme, ...t, palette: { ...s.theme.palette, ...(t as any).palette } } }),
    addSection: (k, data) => set((s) => { (s.sections as any)[k] = data ?? {} }),
    removeSection: (k) => set((s) => { delete (s.sections as any)[k] }),
    fixImages: () => set((s) => {
      const entries = Object.entries(s.sections) as [SectionKey, any][]
      for (const [key, sec] of entries) {
        if (Array.isArray(sec?.images)) {
          sec.images = sec.images.map((im: any, idx: number) => ({
            url: im?.url || `https://picsum.photos/seed/${key}-${idx}/800/600`,
            caption: im?.caption || ''
          }))
        }
      }
    }),
    redesign: (concept) => set((s) => { s.theme.vibe = concept || 'fresh' }),
    rebuild: async () => {
      const brief = get().brief
      const res = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief })
      })
      if (!res.ok) throw new Error('Build failed')
      const next = await res.json()
      set((s) => {
        if (next.theme) s.theme = { ...s.theme, ...next.theme }
        if (next.sections) s.sections = next.sections
      })
    },
  }))
)
