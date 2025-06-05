import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

module.exports = {
  env: {
    NEXT_PUBLIC_BACKEND_URL: 'http://localhost:3001'
  }
}

export default nextConfig;
