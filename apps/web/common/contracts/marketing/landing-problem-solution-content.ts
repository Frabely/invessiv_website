import type { LandingPreviewAnchor } from "@/common/constants";

type LandingProblemSolutionPair = {
  problem: string;
  solution: string;
};

export type LandingProblemSolutionContent = {
  body: string;
  eyebrow: string;
  hint: string;
  pairs: Record<LandingPreviewAnchor, LandingProblemSolutionPair>;
  title: string;
};
