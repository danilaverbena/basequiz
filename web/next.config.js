/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Required for wagmi / viem in browser
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
  async rewrites() {
    return [
      // The Base App / Farcaster clients look for this exact path
      { source: '/.well-known/farcaster.json', destination: '/api/manifest' },
    ];
  },
};

module.exports = nextConfig;
