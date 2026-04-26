import { SocialPlatform } from "@/common/constants/social/social-platforms";
import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

export type LandingFooterContent = {
  bottomNote?: string;
  brand: string;
  columns: Array<{
    title: string;
    links: Array<{
      label: string;
      href: string;
    }>;
  }>;
  copyright: string;
  description: string;
  legalLinks: Array<{
    label: string;
    href: string;
  }>;
  socialLinks: Array<{
    platform: SocialPlatform;
    href: string;
    label: string;
  }>;
};

const LANDING_FOOTER_CONTENT: Record<Locale, LandingFooterContent> = {
  de: de as LandingFooterContent,
  en: en as LandingFooterContent,
};

export function getLandingFooterContent(locale: Locale): LandingFooterContent {
  return LANDING_FOOTER_CONTENT[locale];
}
