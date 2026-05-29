import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

export type LinkedInPostPrivacyNoteContent = {
  eyebrow: string;
  title: string;
  body: string;
  privacyLabel: string;
};

const CONTENT: Record<Locale, LinkedInPostPrivacyNoteContent> = { de, en };

export function getLinkedInPostPrivacyNoteContent(
  locale: Locale,
): LinkedInPostPrivacyNoteContent {
  return CONTENT[locale];
}
