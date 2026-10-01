import type { NextConfig } from "next";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "");
const useMockApi = process.env.NEXT_PUBLIC_USE_MOCK_API !== "false";

const nextConfig: NextConfig = {
  async rewrites() {
    if (useMockApi || !apiBaseUrl) return [];
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiBaseUrl}/api/v1/:path*`
      }
    ];
  }
};

export default nextConfig;
