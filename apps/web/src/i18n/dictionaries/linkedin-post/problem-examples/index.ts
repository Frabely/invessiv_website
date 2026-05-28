import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

export type ProblemExample = {
  text: string;
  time: string;
};

export type LandingAiProblemExamplesContent = {
  eyebrow: string;
  title: string;
  body: string;
  examplesHeading: string;
  examples: ProblemExample[];
  summary: string;
};

const CONTENT: Record<Locale, LandingAiProblemExamplesContent> = { de, en };

export function getLinkedInPostProblemExamplesContent(
  locale: Locale,
): LandingAiProblemExamplesContent {
  return CONTENT[locale];
}
