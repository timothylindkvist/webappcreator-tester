export const metadata = {
  title: 'Sidesmith – Website Creator',
  description: 'Generate sites from a short brief.'
};

import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
