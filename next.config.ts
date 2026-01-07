import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { dev }) => {
    if (dev) {
      // Disable problematic webpack cache to prevent corruption
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
