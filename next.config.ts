import type { NextConfig } from 'next'
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  // Activa el MCP server en /_next/mcp (Next.js 16+)
  experimental: {
    mcpServer: true,
  },
  cacheComponents: true,
  productionBrowserSourceMaps: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  async redirects() {
    return [
      {
        source: '/leads',
        destination: '/contacts',
        permanent: false,
      },
      {
        source: '/estrategias',
        destination: '/lead-scraper',
        permanent: false,
      },
      {
        source: '/proyectos',
        destination: '/tasks',
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' *.youtube.com *.google.com *.googleapis.com *.googletagmanager.com; style-src 'self' 'unsafe-inline' *.googleapis.com; img-src 'self' blob: data: *.googleusercontent.com *.supabase.co; font-src 'self' data: *.gstatic.com r2cdn.perplexity.ai; connect-src 'self' *.supabase.co wss://*.supabase.co *.google-analytics.com fonts.googleapis.com fonts.gstatic.com; frame-src 'self' *.youtube.com; object-src 'none'; base-uri 'self';",
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    // Suprimir warnings de fluent-ffmpeg que usa requires dinámicos
    config.plugins.push(
      new (require('webpack').IgnorePlugin)({
        resourceRegExp: /^(fluent-ffmpeg|ffmpeg-static)$/,
      })
    );
    return config;
  },
}

export default withPWA(nextConfig)
