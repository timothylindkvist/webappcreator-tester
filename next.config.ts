import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['openai']
  }
};

export default nextConfig;

export async function headers() {
  return [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self';",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval';",
            "style-src 'self' 'unsafe-inline';",
            "img-src 'self' data: blob:;",
            "connect-src 'self' https://api.openai.com;",
            "font-src 'self' data:;",
            "frame-ancestors 'none';",
          ].join(' ')
        }
      ]
    }
  ]
}
