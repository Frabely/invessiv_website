import type { MetadataRoute } from "next";
import { SITE_BRAND_NAME, SITE_NAME } from "@/lib/site-metadata";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_BRAND_NAME,
    start_url: "/",
    display: "standalone",
    background_color: "#191a1c",
    theme_color: "#191a1c",
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
