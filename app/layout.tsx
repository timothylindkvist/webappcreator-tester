import type { ReactNode } from 'react';
export const metadata = {
  title: 'Sidesmith – Website Creator',
  description: 'Generate sites from a short brief.'
};

import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
