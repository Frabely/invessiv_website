import { REFERENCE_IMAGES } from "@/common/constants/marketing/reference-images";
import {
  COMPANY,
  COMPANY_SOCIAL_INSTAGRAM,
  COMPANY_SOCIAL_LINKEDIN,
} from "@/config/company";
import type { Locale } from "@/config/i18n";
import { SITE_ROUTES } from "@/config/routes";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";
import { getReferencesMetaContent } from "@/i18n/dictionaries/marketing/references-meta";
import type { ReferencesPageContent } from "@/i18n/dictionaries/marketing/references";
import { SITE_LOGO_URL, SITE_URL } from "@/lib/site-metadata";

export function createReferencesStructuredData(
  locale: Locale,
  content: ReferencesPageContent,
) {
  const organizationId = `${SITE_URL}#organization`;
  const pageUrl = `${SITE_URL}${createLocalePathname(SITE_ROUTES.REFERENCES, locale)}`;
  const collectionId = `${pageUrl}#collection`;
  const breadcrumbId = `${pageUrl}#breadcrumb`;
  const meta = getReferencesMetaContent(locale);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: COMPANY.brandName,
        url: SITE_URL,
        logo: SITE_LOGO_URL,
        email: COMPANY.contact.email,
        sameAs: [COMPANY_SOCIAL_LINKEDIN, COMPANY_SOCIAL_INSTAGRAM],
      },
      {
        "@type": "CollectionPage",
        "@id": collectionId,
        url: pageUrl,
        name: meta.title,
        description: meta.description,
        inLanguage: locale,
        isPartOf: {
          "@id": organizationId,
        },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: content.projects.length,
          itemListElement: content.projects.map((project, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "CreativeWork",
              name: project.title,
              description: project.summary,
              url: project.href,
              image: `${SITE_URL}${REFERENCE_IMAGES[project.imageKey].src}`,
              creator: {
                "@id": organizationId,
              },
            },
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": breadcrumbId,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: content.breadcrumbs.homeLabel,
            item: `${SITE_URL}${createLocalePathname(SITE_ROUTES.HOME, locale)}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: content.breadcrumbs.currentLabel,
            item: pageUrl,
          },
        ],
      },
    ],
  };
}
