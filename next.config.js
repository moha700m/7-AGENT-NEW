/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
  i18n: {
    locales: ['ar', 'en'],
    defaultLocale: 'ar',
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
      ],
    },
  ],
  redirects: async () => [
    {
      source: '/pricing',
      destination: '/marketplace',
      permanent: false,
    },
  ],
};

module.exports = nextConfig;
