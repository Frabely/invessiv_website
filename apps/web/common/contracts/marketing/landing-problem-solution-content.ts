import type { LandingPreviewAnchor } from "@/common/constants";

type LandingProblemSolutionPair = {
  problem: string;
  solution: string;
};

export type LandingProblemSolutionSeal = {
  ariaLabel: string;
  brand: string;
};

export type LandingProblemSolutionContent = {
  body: string;
  eyebrow: string;
  labels: LandingProblemSolutionPair;
  pairs: Record<LandingPreviewAnchor, LandingProblemSolutionPair>;
  seal: LandingProblemSolutionSeal;
  title: string;
};
