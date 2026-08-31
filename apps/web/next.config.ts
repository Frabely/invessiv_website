import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
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
    ];
  },
  images: {
    qualities: [75, 90],
  },
  serverExternalPackages: ["@resvg/resvg-js"],
  transpilePackages: ["@invessiv/common", "@invessiv/db", "@invessiv/ui"],
  outputFileTracingIncludes: {
    "/api/public/generator/linkedin-post": [
      "./node_modules/@fontsource/inter/files/inter-latin-400-normal.woff",
      "./node_modules/@fontsource/inter/files/inter-latin-600-normal.woff",
      "./node_modules/@fontsource/inter/files/inter-latin-700-normal.woff",
      "./node_modules/@fontsource/inter/files/inter-latin-800-normal.woff",
      "./project-skills/linkedin-post-generator/templates/**",
    ],
  },
};

export default nextConfig;
