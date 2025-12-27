import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sgmnhqvofxvbpihdayrp.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 's3.amazonaws.com',
        pathname: '/appforest_uf/**',
      },
      {
        protocol: 'https',
        hostname: 'dubros-image-repository.s3.us-east-1.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'dhbamyabyqtec.cloudfront.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.cdn.bubble.io',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
