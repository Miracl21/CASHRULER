
import type { NextConfig } from 'next';

const isCapacitorBuild = process.env.CAPACITOR_BUILD === '1';

const nextConfig: NextConfig = {
  // Static export for Capacitor/Appflow mobile builds
  ...(isCapacitorBuild ? {
    output: 'export',
    trailingSlash: true,
    images: { unoptimized: true },
  } : {}),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
