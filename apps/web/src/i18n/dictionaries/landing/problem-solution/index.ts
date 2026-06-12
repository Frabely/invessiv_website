import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

export type LandingProblemSolutionPair = {
  problem: string;
  solution: string;
};

export type LandingProblemSolutionContent = {
  body: string;
  eyebrow: string;
  pairs: LandingProblemSolutionPair[];
  problemLabel: string;
  solutionLabel: string;
  title: string;
};

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
