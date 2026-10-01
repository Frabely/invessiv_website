import type { QuestionnaireResolvedBlock } from "../crm/questionnaire/questionnaire-resolved-block";

/** A block as one step of the portal form, with texts in the locale of the request. */
export interface PortalOnboardingBlockDto extends QuestionnaireResolvedBlock {
  /** Step order in the form, starting at 0. */
  position: number;
  /** Company-wide block that still holds answers the team took over from the last onboarding. */
  prefilled: boolean;
  /** The question of the team on this block; set only when it was handed back to the customer. */
  reviewNote: string | null;
}
