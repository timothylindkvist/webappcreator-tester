import "@/styles/globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Influencer Site Generator",
  description: "Chat + Preview builder for creator websites",
  metadataBase: new URL("https://example.com")
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-glam min-h-dvh antialiased">
        {children}
      </body>
    </html>
  );
}
