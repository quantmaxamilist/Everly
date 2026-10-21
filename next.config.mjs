/** @type {import('next').NextConfig} */
const isExport = process.env.STATIC_EXPORT === '1';
const nextConfig = {
  // Normal builds run on Vercel (server routes for the platform come later).
  // STATIC_EXPORT=1 is only used to make a shareable static preview.
  ...(isExport ? { output: 'export', images: { unoptimized: true } } : {}),
  reactStrictMode: true,
};
export default nextConfig;
