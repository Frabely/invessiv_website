import type { Locale } from "@/config/i18n";
import metaDe from "./meta/de.json";
import metaEn from "./meta/en.json";
import pageDe from "./page/de.json";
import pageEn from "./page/en.json";

export type WorkspaceMetaContent = typeof metaDe;
export type WorkspacePageContent = typeof pageDe;

const WORKSPACE_META_CONTENT: Record<Locale, WorkspaceMetaContent> = {
  de: metaDe,
  en: metaEn,
};

const WORKSPACE_PAGE_CONTENT: Record<Locale, WorkspacePageContent> = {
  de: pageDe,
  en: pageEn,
};

export function getWorkspaceMetaContent(locale: Locale): WorkspaceMetaContent {
  return WORKSPACE_META_CONTENT[locale];
}

export function getWorkspacePageContent(locale: Locale): WorkspacePageContent {
  return WORKSPACE_PAGE_CONTENT[locale];
}
