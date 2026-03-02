import type { Locale } from "@/config/i18n";

export type HomeMetaContent = {
  description: string;
  openGraphLocale: "de_DE" | "en_US";
  title: string;
};

const HOME_META_CONTENT: Record<Locale, HomeMetaContent> = {
  de: {
    title: "Landingpages, Webseiten und Prozess-Tools",
    description:
      "Moritz Hecht – Invessiv baut Landingpages, Webseiten und Prozess-Tools mit klarem Fokus auf Conversion.",
    openGraphLocale: "de_DE",
  },
  en: {
    title: "Landing pages, websites, and process tools",
    description:
      "Moritz Hecht – Invessiv builds landing pages, websites, and process tools with a clear conversion focus.",
    openGraphLocale: "en_US",
  },
};

export function getHomeMetaContent(locale: Locale): HomeMetaContent {
  return HOME_META_CONTENT[locale];
}
