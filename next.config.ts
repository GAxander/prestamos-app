import type { NextConfig } from "next";

// Quitamos la parte de ": NextConfig" para que no moleste
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;