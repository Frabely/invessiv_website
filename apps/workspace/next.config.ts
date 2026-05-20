import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@invessiv/common", "@invessiv/db"],
};

export default nextConfig;
