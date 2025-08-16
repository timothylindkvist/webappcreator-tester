import "./../styles/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lovable-style Starter",
  description: "A sleek Next.js starter inspired by lovable.dev with Vercel AI Gateway",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfbf8" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1c1c" },
  ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <div className="flex min-h-dvh flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
