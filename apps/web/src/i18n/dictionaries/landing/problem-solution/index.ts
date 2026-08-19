import type { LandingProblemSolutionContent } from "@/common/contracts/marketing";
import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

const LANDING_PROBLEM_SOLUTION_CONTENT: Record<
  Locale,
  LandingProblemSolutionContent
> = {
  de,
  en,
};

export function getLandingProblemSolutionContent(
  locale: Locale,
): LandingProblemSolutionContent {
  return LANDING_PROBLEM_SOLUTION_CONTENT[locale];
}
