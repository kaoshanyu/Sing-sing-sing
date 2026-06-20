import type { NextConfig } from "next";

const isExport = process.env.OUTPUT_EXPORT === "1"
const apiProxyTarget = process.env.NEXT_PUBLIC_API_PROXY || "http://localhost:8000"

const nextConfig: NextConfig = {
  ...(isExport ? { output: "export" as const, basePath: "/I-want-you" as const } : {}),
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    if (isExport) return []
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/api/:path*`,
      },
      {
        source: "/static/:path*",
        destination: `${apiProxyTarget}/static/:path*`,
      },
    ]
  },
};

export default nextConfig;
