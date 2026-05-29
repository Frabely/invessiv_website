import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/", destination: "/de", permanent: true },
      {
        source: "/de/landing",
        destination: "/de/services/landing-page",
        statusCode: 301,
      },
      {
        source: "/en/landing",
        destination: "/en/services/landing-page",
        statusCode: 301,
      },
      {
        source: "/de/services",
        destination: "/de#services",
        statusCode: 301,
      },
      {
        source: "/en/services",
        destination: "/en#services",
        statusCode: 301,
      },
      { source: "/imprint", destination: "/de/imprint", permanent: true },
      { source: "/privacy", destination: "/de/privacy", permanent: true },
      { source: "/terms", destination: "/de/terms", permanent: true },
    ];
  },
  images: {
    // Allow a high-quality variant for text-heavy showcase images (e.g. the
    // generated LinkedIn slide) so type stays crisp; 75 stays the default.
    qualities: [75, 90],
  },
  transpilePackages: ["@invessiv/common", "@invessiv/db"],
};

export default nextConfig;
