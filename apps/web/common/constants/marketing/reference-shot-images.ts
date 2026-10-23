import allmacherHighlightsImage from "@/assets/references/allmacher/highlights.png";
import allmacherTrainerImage from "@/assets/references/allmacher/trainer.png";
import koljaProblemSolutionImage from "@/assets/references/kolja/problem-solution.png";
import koljaServicesImage from "@/assets/references/kolja/services.png";
import type { ReferenceShotKey } from "@/common/constants";
import { REFERENCE_IMAGES } from "./reference-images";

export const REFERENCE_SHOT_IMAGES = {
  "allmacher-overview": REFERENCE_IMAGES.allmacher,
  "allmacher-highlights": allmacherHighlightsImage,
  "allmacher-trainer": allmacherTrainerImage,
  "kolja-overview": REFERENCE_IMAGES.kolja,
  "kolja-problem-solution": koljaProblemSolutionImage,
  "kolja-services": koljaServicesImage,
  "consumption-overview": REFERENCE_IMAGES.consumption,
} as const satisfies Record<ReferenceShotKey, unknown>;
