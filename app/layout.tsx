import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Universal Site Builder',
  description: 'Generate stunning websites for any idea or business with AI.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
