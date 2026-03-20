import type { Locale } from "@/config/i18n";

export type HomeMetaContent = {
  description: string;
  openGraphLocale: "de_DE" | "en_US";
  title: string;
};

const HOME_META_CONTENT: Record<Locale, HomeMetaContent> = {
  de: {
    title: "Invessiv | Webseiten, Landingpages & Prozess-Tools",
    description:
      "Invessiv entwickelt Landingpages, Webseiten und Prozess-Tools mit klarem Leistungsrahmen, sauberem Setup und Conversion-Fokus.",
    openGraphLocale: "de_DE",
  },
  en: {
    title: "Invessiv | Websites, Landing Pages & Process Tools",
    description:
      "Invessiv builds landing pages, websites, and process tools with a clear delivery frame, clean setup, and conversion focus.",
    openGraphLocale: "en_US",
  },
};

export function getHomeMetaContent(locale: Locale): HomeMetaContent {
  return HOME_META_CONTENT[locale];
}
