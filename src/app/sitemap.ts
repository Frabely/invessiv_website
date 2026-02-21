import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

const indexedRoutes = [
  "/",
  "/leistungen",
  "/vorlagen",
  "/kontakt",
  "/impressum",
  "/datenschutz",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return indexedRoutes.map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: now,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
