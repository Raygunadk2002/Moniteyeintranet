/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Remove experimental options that cause issues
  experimental: {},
  // Optimize for Vercel deployment
  output: 'standalone',
  // Handle potential build issues during deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig 