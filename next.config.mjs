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
  }
};

export default nextConfig;
