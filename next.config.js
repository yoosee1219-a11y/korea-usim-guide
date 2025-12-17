/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['osrjxlrqngizamjszurf.supabase.co'],
  },
  // Ensure dynamic rendering for admin pages
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig
