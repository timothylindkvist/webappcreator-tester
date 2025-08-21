
// lib/toolRuntime.ts
import { useSite } from '@/store/site'

const argsById = new Map<string, string>()

// Optional generic handler if you want to wire it to non-React streams
export function handleToolEvent(event: any) {
  const t = event.type as string

  if (t === 'response.tool_call.created') {
    argsById.set(event.tool_call.id, '')
    return
  }

  if (t === 'response.tool_call.delta') {
    const prev = argsById.get(event.tool_call.id) || ''
    const delta = event.delta?.arguments || ''
    argsById.set(event.tool_call.id, prev + delta)
    return
  }

  if (t === 'response.tool_call.completed') {
    const name: string = event.tool_call?.name
    const raw = argsById.get(event.tool_call.id) || event.tool_call?.arguments || '{}'
    let args: any
    try { args = JSON.parse(raw) } catch { args = {} }
    argsById.delete(event.tool_call.id)

    const st = useSite.getState()
    switch (name) {
      case 'setSiteData':
        st.setData(args)
        break
      case 'updateBrief':
        if (typeof args.brief === 'string') st.setBrief(args.brief)
        break
      case 'applyTheme':
        st.applyTheme(args.theme || {})
        break
      case 'addSection':
        st.addSection(args.section, args.data ?? {})
        break
      case 'removeSection':
        st.removeSection(args.section)
        break
      case 'fixImages':
        st.fixImages()
        break
      case 'redesign':
        st.redesign(args.concept)
        break
      case 'rebuild':
        st.rebuild()
        break
      default:
        console.warn('Unknown tool:', name, args)
    }
  }
}
