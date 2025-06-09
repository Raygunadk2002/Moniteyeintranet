/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    // Use strict CSS chunking 
    cssChunking: 'strict',
  },
}

module.exports = nextConfig 