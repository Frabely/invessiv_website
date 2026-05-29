import type { MetadataRoute } from "next";
import { isMarketingProofEnabled } from "@/config/marketing-launch";
import { SITE_URL } from "@/lib/site-metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/de`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/en`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/de/services/landing-page`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/en/services/landing-page`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/de/imprint`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/en/imprint`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/de/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/en/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/de/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/en/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  if (isMarketingProofEnabled()) {
    entries.splice(
      4,
      0,
      {
        url: `${SITE_URL}/de/projects`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
      },
      {
        url: `${SITE_URL}/en/projects`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
      },
    );
  }

  return entries;
}
