// lib/toolRuntime.ts
import { useSite, type SiteState } from '@/store/site'

const argsById = new Map<string, string>()

export function handleToolEvent(event: any) {
  const t = event.type as string

  if (t === 'response.tool_call.created') {
    console.log('tool_call.created', event.tool_call?.name, event.tool_call?.id);
    argsById.set(event.tool_call.id, '')
    return
  }

  if (t === 'response.tool_call.delta') {
    console.log('tool_call.delta', event.tool_call?.id, event.delta?.arguments);
    const id = event.tool_call.id
    const prev = argsById.get(id) || ''
    argsById.set(id, prev + (event.delta?.arguments ?? ''))
    return
  }

  if (t === 'response.tool_call.completed') {
    console.log('tool_call.completed', event.tool_call?.name, event.tool_call?.id);
    const id = event.tool_call.id
    const name = event.tool_call.name as string
    const raw = argsById.get(id) || '{}'
    argsById.delete(id)

    let args: any
    try { args = JSON.parse(raw) } catch { args = {} }

    console.log('executeTool', name, args); executeTool(name, args)
    return
  }
}

function executeTool(name: string, args: any) {
  const apply = useSite.getState().apply

  switch (name) {
    case 'updateBrief': {
      const { brief } = args
      apply((s: SiteState) => { s.brief = brief })
      break
    }
    case 'rebuild': {
      apply((s: SiteState) => { s.sections = {} })
      break
    }
    case 'setTheme': {
      const { brand, accent, background, foreground, vibe } = args
      apply((s: SiteState) => { s.theme = { brand, accent, background, foreground, vibe } })
      break
    }
    case 'removeSection': {
      const { section } = args
      apply((s: SiteState) => { delete (s.sections as any)[section] })
      break
    }
    case 'addSection': {
      const { section, payload } = args
      apply((s: SiteState) => { (s.sections as any)[section] = payload })
      break
    }
    case 'patchSection': {
      const { section, content } = args
      apply((s: SiteState) => {
        (s.sections as any)[section] = { ...(s.sections as any)[section], ...content }
      })
      break
    }
    case 'setTypography': {
      const { font } = args
      apply((s: SiteState) => { s.typography = { font } })
      break
    }
    case 'setDensity': {
      const { density } = args
      apply((s: SiteState) => { s.density = density })
      break
    }
    case 'applyStylePreset': {
      const { preset } = args
      const presets: Record<string, any> = {
        playful: {
          theme: { brand: '#7C3AED', accent: '#F59E0B', background: '#FFFFFF', foreground: '#111827', vibe: 'playful' },
          font: 'Poppins',
          density: 'comfortable',
        },
        editorial: {
          theme: { brand: '#111827', accent: '#6B7280', background: '#FFFFFF', foreground: '#111827', vibe: 'editorial' },
          font: 'Merriweather',
          density: 'cozy',
        },
        clean: {
          theme: { brand: '#3B82F6', accent: '#22C55E', background: '#FFFFFF', foreground: '#0B1220', vibe: 'clean' },
          font: 'Inter',
          density: 'comfortable',
        },
      }
      const p = presets[preset] || presets.clean
      apply((s: SiteState) => {
        s.theme = p.theme
        s.typography = { font: p.font }
        s.density = p.density
      })
      break
    }
    case 'fixImages': {
      const { section } = args
      apply((s: SiteState) => {
        if (section === 'all') {
          Object.keys(s.sections).forEach((k) => {
            const sec: any = (s.sections as any)[k]
            if (sec && Array.isArray(sec.images)) {
              sec.images = sec.images.map((im: any, idx: number) => ({ alt: im.alt || 'Image', src: im.src || `https://picsum.photos/seed/${k}-${idx}/800/600`, caption: im.caption || '' }))
            }
          })
        } else {
          const sec: any = (s.sections as any)[section]
          if (sec && Array.isArray(sec.images)) {
            sec.images = sec.images.map((im: any, idx: number) => ({ alt: im.alt || 'Image', src: im.src || `https://picsum.photos/seed/${section}-${idx}/800/600`, caption: im.caption || '' }))
          }
        }
      })
      break
    }
    case 'redesign': {
      // No-op placeholder: you can map concepts to presets
      break
    }
    default:
      console.warn('Unknown tool:', name, args)
  }
}