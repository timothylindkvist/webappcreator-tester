import type { ReactNode } from 'react';
export const metadata = {
  title: 'appcreator',
  description: 'Generate a website from a short description.'
};

import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
