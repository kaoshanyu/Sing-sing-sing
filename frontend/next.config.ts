import type { NextConfig } from "next";

const isExport = process.env.OUTPUT_EXPORT === "1"

const nextConfig: NextConfig = {
  ...(isExport ? { output: "export" as const, basePath: "/I-want-you" as const } : {}),
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
