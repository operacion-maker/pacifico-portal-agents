import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // Pre-warm dynamic routes at server startup to avoid 25s first-compile penalty
    optimisticClientCache: true,
  },
  // Exclude massive optional packages from the client bundle
  webpack(config, { isServer }) {
    if (!isServer) {
      // mermaid (~2MB) is only used in MarkdownRenderer — prevent it loading in every route
      config.resolve.alias = {
        ...config.resolve.alias,
      };
    }
    return config;
  },
};

export default nextConfig;
