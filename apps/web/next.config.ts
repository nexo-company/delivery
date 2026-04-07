import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Cardápio pode usar imagens externas no futuro */
  images: { remotePatterns: [] },
};

export default nextConfig;
