import type { Locale } from "@/config/i18n";
import de from "./projects-meta.de.json";
import en from "./projects-meta.en.json";

export type ProjectsMetaContent = {
  description: string;
  openGraphLocale: "de_DE" | "en_US";
  title: string;
};

const PROJECTS_META_CONTENT: Record<Locale, ProjectsMetaContent> = {
  de: de as ProjectsMetaContent,
  en: en as ProjectsMetaContent,
};

export function getProjectsMetaContent(locale: Locale): ProjectsMetaContent {
  return PROJECTS_META_CONTENT[locale];
}
