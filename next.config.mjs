/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '5.imimg.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
}

export default nextConfig
