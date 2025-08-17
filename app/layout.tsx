import './globals.css';
import type { Metadata } from 'next';
import { clsx } from 'clsx';

export const metadata: Metadata = {
  title: 'site Site Builder',
  description: 'Generate stunning site websites with AI.',
  metadataBase: new URL('https://example.com'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={clsx('min-h-dvh bg-background text-foreground')}>{children}</body>
    </html>
  );
}
