import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable webpack cache for faster rebuilds
  webpack: (config) => {
    config.cache = true;
    return config;
  },

  // External packages for server components (moved from experimental in 15.5)
  serverExternalPackages: ['@supabase/ssr', '@supabase/supabase-js'],
};

export default nextConfig;
