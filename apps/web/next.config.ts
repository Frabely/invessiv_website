import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/", destination: "/de", permanent: true },
      { source: "/imprint", destination: "/de/imprint", permanent: true },
      { source: "/privacy", destination: "/de/privacy", permanent: true },
      { source: "/terms", destination: "/de/terms", permanent: true },
    ];
  },
  transpilePackages: ["@invessiv/common", "@invessiv/db"],
};

export default nextConfig;
