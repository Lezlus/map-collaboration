import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [new URL(`https://${process.env.NEXT_PUBLIC_CDN}/**`)]
  }
};

export default nextConfig;
