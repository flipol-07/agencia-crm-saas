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
