import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable webpack cache for faster rebuilds
  webpack: (config) => {
    config.cache = true;
    return config;
  },

  // External packages for server components (moved from experimental in 15.5)
  serverExternalPackages: ['@supabase/ssr', '@supabase/supabase-js'],

  // Allow cross-origin requests from your Mac to kai-debvm dev server
  allowedDevOrigins: ['kai-debvm:3090'],
};

export default nextConfig;
