import type { MetadataRoute } from "next";
import { SUPPORTED_LOCALES } from "@/config/i18n";
import { SITE_ROUTES } from "@/config/routes";
import { isMarketingProofEnabled } from "@/config/marketing-launch";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";
import { SITE_URL } from "@/lib/site-metadata";

function sitemapEntry(pathname: string): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE_URL}${pathname}`,
  };
}

function localizedRouteEntries(route: string): MetadataRoute.Sitemap {
  return SUPPORTED_LOCALES.map((locale) =>
    sitemapEntry(createLocalePathname(route, locale)),
  );
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    ...localizedRouteEntries(SITE_ROUTES.HOME),
    ...localizedRouteEntries(SITE_ROUTES.LANDING_PAGE_SERVICE),
    ...localizedRouteEntries(SITE_ROUTES.LINKEDIN_POST_SERVICE),
  ];

  if (isMarketingProofEnabled()) {
    entries.push(...localizedRouteEntries(SITE_ROUTES.PROJECTS));
  }

  return entries;
}
