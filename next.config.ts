import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable ESLint during production build
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // Suppress the webpack warning about critical dependencies in Supabase realtime
    config.module = config.module || {};
    config.module.exprContextCritical = false;
    
    // Alternative approach: ignore specific warnings
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /node_modules\/@supabase\/realtime-js/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ];

    return config;
  },
};

export default nextConfig;
