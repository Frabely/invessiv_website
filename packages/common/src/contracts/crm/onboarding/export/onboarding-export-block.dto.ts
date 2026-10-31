import type { OnboardingBlockReviewStatus } from "../../../../constants/crm/onboarding/onboarding-block-review-statuses";
import type { OnboardingExportFieldDto } from "./onboarding-export-field.dto";

/** One step of the form with all its questions. */
export interface OnboardingExportBlockDto {
  /** Stable key such as `texts_tone` or `design_direction`; the same across forms, unlike the title. */
  key: string;
  /** Step title in the export locale. */
  title: string;
  /** Hint the customer reads above the questions; null when the block has none. */
  intro: string | null;
  /** The team's review of the block; `pending` until someone looked at it. */
  reviewStatus: OnboardingBlockReviewStatus;
  /** Open question or remark of the review; null when the block carries none. */
  reviewNote: string | null;
  /** Block-level questions in display order, including hidden and unanswered ones. */
  fields: OnboardingExportFieldDto[];
}
