import type { NextConfig } from 'next';

const isProduction = process.env.NODE_ENV === 'production';

/** The authored static pages in public/ run no inline script or style, so they get a stricter policy than app routes. */
const staticPagePolicy = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "media-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProduction ? ['upgrade-insecure-requests'] : [])
].join('; ');

const baseHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), midi=(self)' }
];

const staticPages = ['/', '/index.html', '/learn', '/learn/', '/learn/index.html'];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  skipTrailingSlashRedirect: true,
  serverExternalPackages: ['pg'],
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/', destination: '/index.html' },
        { source: '/learn', destination: '/learn/index.html' },
        { source: '/learn/', destination: '/learn/index.html' }
      ],
      afterFiles: [],
      fallback: []
    };
  },
  async headers() {
    return [
      { source: '/:path*', headers: baseHeaders },
      ...staticPages.map((source) => ({
        source,
        headers: [{ key: 'Content-Security-Policy', value: staticPagePolicy }]
      })),
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }] }
    ];
  }
};

export default nextConfig;
