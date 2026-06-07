import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Whitelist your local network IP for hot-reloading
  allowedDevOrigins: ["172.25.80.94", "localhost"],
};

export default nextConfig;
