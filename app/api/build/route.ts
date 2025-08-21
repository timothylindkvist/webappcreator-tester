
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest } from 'next/server'
import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
const MODEL = process.env.NEXT_PUBLIC_AI_MODEL || 'gpt-4.1-mini'

export async function POST(req: NextRequest) {
  try {
    const { brief = '' } = await req.json()

    if (!process.env.OPENAI_API_KEY) {
      // Deterministic fallback for local testing without an API key
      return Response.json({
        theme: {
          palette: { brand: '#0ea5e9', accent: '#a78bfa', background: '#0b0b0d', foreground: '#f6f7fb' }
        },
        sections: {
          hero: { title: 'Your New Site', subtitle: brief || 'Describe your site in the chat and I will build it.', cta: { label: 'Get started' } },
          about: { heading: 'About Us', body: 'We help people with exceptional web experiences.', bullets: ['Fast', 'Accessible', 'Beautiful', 'Conversion-focused'] },
          features: { title: 'What you get', items: [{ title: 'Design', body: 'Thoughtful layouts and clean typography.' }, { title: 'Development', body: 'Modern stack with performance in mind.' }] },
          gallery: { images: [{ url: 'https://picsum.photos/seed/a/800/600' }, { url: 'https://picsum.photos/seed/b/800/600' }, { url: 'https://picsum.photos/seed/c/800/600' }] },
          testimonials: { items: [{ quote: 'They nailed it!', author: 'Happy Client' }] },
          pricing: { heading: 'Pricing', plans: [{ name: 'Starter', price: '$499', features: ['One-pager', 'Basic CMS'] }, { name: 'Pro', price: '$1,999', features: ['Multi-page', 'Blog', 'Brand kit'] }] },
          faq: { items: [{ q: 'How long?', a: 'Usually 1–2 weeks for a small site.' }] },
          cta: { heading: 'Ready to talk?', subheading: 'Tell me about your project.', buttonLabel: 'Request a quote' }
        }
      })
    }

    const system = [
      'You generate JSON site data for a portfolio/SMB site.',
      'Return valid JSON with keys: theme, sections. theme.palette has brand, accent, background, foreground.',
      'Sections may include: hero, about, features, gallery, testimonials, pricing, faq, cta.',
      'Keep strings short and natural.'
    ].join('\n')

    const r = await client.responses.create({
      model: MODEL,
      input: [
        { role: 'system', content: system },
        { role: 'user', content: `Brief: ${brief}` },
      ],
      response_format: { type: 'json_object' }
    } as any)

    const text = (r as any).output_text || (typeof (r as any).output[0]?.content[0]?.text === 'string' ? (r as any).output[0].content[0].text : '{}')
    let data: any
    try { data = JSON.parse(text) } catch { data = {} }
    return Response.json(data || {})
  } catch (e) {
    return Response.json({ sections: {} })
  }
}
