import type { MetadataRoute } from "next";
import { SITE_BRAND_NAME, SITE_NAME } from "@/lib/site-metadata";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_BRAND_NAME,
    start_url: "/de",
    display: "standalone",
    background_color: "#140a06",
    theme_color: "#140a06",
    icons: [
      {
        src: "/favicon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/favicon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
