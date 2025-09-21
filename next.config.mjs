/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb'
    },
    typedRoutes: true,
    instrumentationHook: true
  },
  reactStrictMode: true,
  eslint: {
    dirs: ['app', 'components', 'lib', 'actions', 'server']
  },
  // Optimizaciones de rendimiento
  compress: true,
  poweredByHeader: false,
  // Optimizaciones de bundle
  optimizeFonts: true,
  // Configuración de imágenes
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 año
  },
  // Configuración de headers para cacheo
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
