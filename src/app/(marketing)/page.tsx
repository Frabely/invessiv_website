import type { Metadata } from "next";
import { MarketingHomePageClient } from "@/components/marketing/home/marketing-home-page-client";
import { COMPANY } from "@/config/company";
import { MARKETING_ROOT_META_CONTENT } from "@/i18n/dictionaries/marketing/root-meta";
import { SITE_NAME, SITE_URL } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: MARKETING_ROOT_META_CONTENT.pageTitle,
  description: MARKETING_ROOT_META_CONTENT.description,
  alternates: {
    canonical: "/",
    languages: {
      de: "/de",
      en: "/en",
    },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: `${SITE_NAME} | ${MARKETING_ROOT_META_CONTENT.pageTitle}`,
    description: MARKETING_ROOT_META_CONTENT.openGraphDescription,
    siteName: SITE_NAME,
    locale: "en_US",
  },
};

const marketingStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: COMPANY.legalName,
      url: SITE_URL,
      logo: `${SITE_URL}/brand/icon.png`,
      email: COMPANY.contact.email,
      telephone: COMPANY.contact.phoneDisplayEn,
    },
    {
      "@type": "Service",
      serviceType: "Web design and web development",
      provider: {
        "@type": "Organization",
        name: COMPANY.legalName,
        url: SITE_URL,
      },
      areaServed: "DE",
      availableLanguage: ["de", "en"],
      description: MARKETING_ROOT_META_CONTENT.serviceDescription,
      offers: {
        "@type": "Offer",
        priceCurrency: "EUR",
        priceSpecification: {
          "@type": "PriceSpecification",
          minPrice: 99,
        },
      },
    },
  ],
};

export default function MarketingHomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(marketingStructuredData),
        }}
      />
      <MarketingHomePageClient />
    </>
  );
}
