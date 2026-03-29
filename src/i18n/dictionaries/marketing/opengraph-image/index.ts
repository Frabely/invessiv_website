import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

export type OpenGraphImageCopy = {
  badge: string;
  footer: string;
  headline: string;
  subline: string;
  tagline: string;
};

const OPENGRAPH_IMAGE_COPY: Record<Locale, OpenGraphImageCopy> = {
  de: de as OpenGraphImageCopy,
  en: en as OpenGraphImageCopy,
};

export function getOpenGraphImageCopy(locale: Locale): OpenGraphImageCopy {
  return OPENGRAPH_IMAGE_COPY[locale];
}
