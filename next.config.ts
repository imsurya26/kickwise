import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: [],
  env: {
    PREDICTION_API_URL: process.env.PREDICTION_API_URL || "http://127.0.0.1:8000",
  },
};

export default nextConfig;

