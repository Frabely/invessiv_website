import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

export type LinkedInPostMetaStructuredData = {
  applicationName: string;
  applicationCategory: string;
  operatingSystem: string;
  featureList: string[];
  breadcrumbs: {
    home: string;
    services: string;
    service: string;
  };
};

export type LinkedInPostMetaContent = {
  title: string;
  description: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  imageAlt: string;
  structuredData: LinkedInPostMetaStructuredData;
};

const CONTENT: Record<Locale, LinkedInPostMetaContent> = { de, en };

export function getLinkedInPostMetaContent(
  locale: Locale,
): LinkedInPostMetaContent {
  return CONTENT[locale];
}
