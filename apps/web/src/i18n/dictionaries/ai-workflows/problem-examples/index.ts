import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

export type LandingAiProblemExamplesContent = {
  eyebrow: string;
  title: string;
  body: string;
  examplesHeading: string;
  examples: string[];
  summary: string;
};

const CONTENT: Record<Locale, LandingAiProblemExamplesContent> = { de, en };

export function getAiWorkflowsProblemExamplesContent(
  locale: Locale,
): LandingAiProblemExamplesContent {
  return CONTENT[locale];
}
