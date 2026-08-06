import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

export type LandingStructuredDataContent = {
  audienceType: string;
  areaServed: {
    countryCode: string;
  };
  breadcrumbs: {
    home: string;
    services: string;
    service: string;
  };
  service: {
    name: string;
    serviceType: string;
  };
};

const LANDING_STRUCTURED_DATA_CONTENT: Record<
  Locale,
  LandingStructuredDataContent
> = {
  de: de as LandingStructuredDataContent,
  en: en as LandingStructuredDataContent,
};

export function getLandingStructuredDataContent(
  locale: Locale,
): LandingStructuredDataContent {
  return LANDING_STRUCTURED_DATA_CONTENT[locale];
}
