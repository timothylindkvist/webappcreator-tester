
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SiteCraft — AI website builder',
  description: 'Design and edit a site via chat, live.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
