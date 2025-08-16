import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Site — Build for the web faster",
  description: "Website creator with a polished, glassy UI.",
  metadataBase: new URL("https://your-domain.com"),
  openGraph: { images: ["/og.png"] }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="text-white antialiased">{children}</body>
    </html>
  );
}
