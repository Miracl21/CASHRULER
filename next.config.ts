
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // NOTE: For Capacitor (mobile) builds, use a separate next.config.capacitor.ts
  // with output: 'export' and move AI features to API routes.
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
