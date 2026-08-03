import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@invessiv/common", "@invessiv/db", "@invessiv/ui"],
  outputFileTracingIncludes: {
    "/api/workspace/outreach/**": ["./local-skills/**"],
  },
  async redirects() {
    return [
      {
        source: "/sign-in",
        destination: "/de/sign-in",
        permanent: false,
      },
      {
        source: "/sign-up",
        destination: "/de/sign-up",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
