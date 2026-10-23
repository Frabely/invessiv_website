export const REFERENCE_SHOT_KEY = {
  AllmacherOverview: "allmacher-overview",
  AllmacherHighlights: "allmacher-highlights",
  AllmacherTrainer: "allmacher-trainer",
  KoljaOverview: "kolja-overview",
  KoljaProblemSolution: "kolja-problem-solution",
  KoljaServices: "kolja-services",
  ConsumptionOverview: "consumption-overview",
} as const;

export type ReferenceShotKey =
  (typeof REFERENCE_SHOT_KEY)[keyof typeof REFERENCE_SHOT_KEY];
