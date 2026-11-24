/** @type {import('next').NextConfig} */
const isExport = process.env.STATIC_EXPORT === '1';
const nextConfig = {
  // Normal builds run on Vercel (server routes for the platform come later).
  // STATIC_EXPORT=1 is only used to make a shareable static preview.
  ...(isExport ? { output: 'export', images: { unoptimized: true } } : {}),
  reactStrictMode: true,
  // photo/brochure uploads go through server actions (Vercel caps request bodies at ~4.5 MB)
  experimental: { serverActions: { bodySizeLimit: '4.5mb' } },
  // basic security headers (stop the site being framed by other sites, no MIME sniffing, private referrers)
  ...(isExport ? {} : {
    async headers() {
      return [{
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        ],
      }];
    },
  }),
};
export default nextConfig;
