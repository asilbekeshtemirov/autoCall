/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Skip type checking during build (done separately in CI)
  typescript: {
    ignoreBuildErrors: false,
  },
  // Skip ESLint during build (done separately in CI)
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
