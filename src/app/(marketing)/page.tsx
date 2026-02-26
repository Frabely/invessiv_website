import type { Metadata } from "next";
import { MarketingHomePageClient } from "@/components/marketing/home/marketing-home-page-client";
import { COMPANY } from "@/config/company";
import { SITE_NAME, SITE_URL } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "Landing pages, websites, and process tools",
  description:
    "Invessiv builds landing pages, websites, and process tools with clear structure, fast execution, and measurable conversion focus.",
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
    title: `${SITE_NAME} | Landing pages, websites, and process tools`,
    description:
      "From idea to production-ready website fast: clear offers, predictable delivery rhythm, and focused execution.",
    siteName: SITE_NAME,
    locale: "en_US",
  },
};

const marketingStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: SITE_NAME,
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
        name: SITE_NAME,
        url: SITE_URL,
      },
      areaServed: "DE",
      availableLanguage: ["de", "en"],
      description:
        "Landing pages, website upgrades, and process tools focused on performance, clarity, and conversion.",
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
