import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

export type LandingProblemContent = {
  body: string;
  eyebrow: string;
  issueHeading: string;
  points: string[];
  summary: string;
  title: string;
};

const LANDING_PROBLEM_CONTENT: Record<Locale, LandingProblemContent> = {
  de,
  en,
};

export function getLandingProblemContent(
  locale: Locale,
): LandingProblemContent {
  return LANDING_PROBLEM_CONTENT[locale];
}
