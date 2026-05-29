import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

export type LinkedInPostExampleAuthor = {
  name: string;
  role: string;
  avatarInitials: string;
};

export type LinkedInPostExampleImage = {
  headline: string;
  footnote: string;
};

export type LinkedInPostExampleSample = {
  id: string;
  toneLabel: string;
  topicLabel: string;
  author: LinkedInPostExampleAuthor;
  image: LinkedInPostExampleImage;
  caption: string;
};

export type LinkedInPostExampleContent = {
  eyebrow: string;
  title: string;
  body: string;
  samplesAriaLabel: string;
  samples: LinkedInPostExampleSample[];
  ctaLabel: string;
  ctaAriaLabel: string;
};

const CONTENT: Record<Locale, LinkedInPostExampleContent> = { de, en };

export function getLinkedInPostExampleContent(
  locale: Locale,
): LinkedInPostExampleContent {
  return CONTENT[locale];
}
