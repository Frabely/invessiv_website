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
  /** Public path to an actual rendered PNG (e.g. "/linkedin-post/example-foo.png").
   * When provided, a real <Image> is shown instead of the CSS-generated placeholder. */
  src?: string;
};

export type LinkedInPostExampleSample = {
  id: string;
  toneLabel: string;
  topicLabel: string;
  author: LinkedInPostExampleAuthor;
  image: LinkedInPostExampleImage;
  caption: string;
  promptText: string;
};

export type LinkedInPostExampleContent = {
  eyebrow: string;
  title: string;
  body: string;
  samplesAriaLabel: string;
  promptLabel: string;
  captionMore: string;
  captionLess: string;
  disclaimer: string;
  samples: LinkedInPostExampleSample[];
  ctaLead: string;
  ctaLabel: string;
  ctaAriaLabel: string;
};

const CONTENT: Record<Locale, LinkedInPostExampleContent> = { de, en };

export function getLinkedInPostExampleContent(
  locale: Locale,
): LinkedInPostExampleContent {
  return CONTENT[locale];
}
