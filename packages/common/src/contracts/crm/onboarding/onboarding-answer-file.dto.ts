import type { OnboardingAnswerFileRefDto } from "./onboarding-answer-file-ref.dto";
import type { OnboardingAttachment } from "./onboarding-attachment";

/** A file attached to a files field; the pre-fill may attach the same file to a second form. */
export interface OnboardingAnswerFileDto extends OnboardingAnswerFileRefDto {
  /** Order within the field and entry, starting at 0. */
  position: number;
  /** The attached file entry; it belongs to the form's customer. */
  file: OnboardingAttachment;
}
