
import type { NextConfig } from 'next';

const isCapacitorBuild = process.env.CAPACITOR_BUILD === '1';

const nextConfig: NextConfig = {
  // Static export for Capacitor/Appflow mobile builds
  ...(isCapacitorBuild ? {
    output: 'export',
    trailingSlash: true,
  } : {}),
  images: {
    ...(isCapacitorBuild ? { unoptimized: true } : {}),
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Supabase env vars — these are public/anon keys, safe for client-side
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ujmegvoctypwgpkwmjbk.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbWVndm9jdHlwd2dwa3dtamJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTk4NTksImV4cCI6MjA4ODMzNTg1OX0.vBmHyddnuKUduzZ7m4QGHIbjUK2DOztOEW32YYRq1Rg',
  },
};

export default nextConfig;
