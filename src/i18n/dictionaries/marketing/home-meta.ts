import type { Locale } from "@/config/i18n";

export type HomeMetaContent = {
  description: string;
  openGraphLocale: "de_DE" | "en_US";
  title: string;
};

const HOME_META_CONTENT: Record<Locale, HomeMetaContent> = {
  de: {
    title: "Landingpages, Webseiten, Prozess-Tools und KI-Templates & Agents",
    description:
      "Moritz Hecht – Invessiv baut Landingpages, Webseiten, Prozess-Tools sowie KI-Templates & Agents im KI-Agenten-Workflow mit klarem Scope und Conversion-Fokus.",
    openGraphLocale: "de_DE",
  },
  en: {
    title: "Landing pages, websites, process tools, and AI templates & agents",
    description:
      "Moritz Hecht – Invessiv builds landing pages, websites, process tools, and AI templates & agents in an AI agent workflow with clear scope and conversion focus.",
    openGraphLocale: "en_US",
  },
};

export function getHomeMetaContent(locale: Locale): HomeMetaContent {
  return HOME_META_CONTENT[locale];
}
