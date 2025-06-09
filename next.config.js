/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    // Use strict CSS chunking for better performance
    cssChunking: 'strict',
  },
  // Optimize for Vercel deployment
  output: 'standalone',
  // Handle potential build issues
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig 