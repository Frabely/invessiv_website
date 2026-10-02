import type { OnboardingFormStatus } from "../../../constants/crm/onboarding/onboarding-form-statuses";
import type { QuestionnaireAnswerFileRefDto } from "../questionnaire/questionnaire-answer-file-ref.dto";
import type { QuestionnaireAnswerFileDto } from "../questionnaire/questionnaire-answer-file.dto";
import type { QuestionnaireAnswerDto } from "../questionnaire/questionnaire-answer.dto";
import type { OnboardingFormBlockDto } from "./onboarding-form-block.dto";
import type { OnboardingFormServiceDto } from "./onboarding-form-service.dto";
import type { QuestionnaireGroupEntryDto } from "../questionnaire/questionnaire-group-entry.dto";

/** The onboarding form of one project with its own block copies, answers and files. */
export interface OnboardingFormDto {
  /** Form id; every form command addresses this value. */
  id: string;
  /** Owning customer, derived from the project and stored for portal filters. */
  customerId: string;
  /** The one project this form belongs to; a project has at most one form. */
  projectId: string;
  /** Template the form was started from; null when started empty or once the template was deleted. */
  sourceTemplateId: string | null;
  /** Lifecycle state; allowed changes come from `ONBOARDING_FORM_TRANSITIONS`. */
  status: OnboardingFormStatus;
  /** Member who started the form. */
  createdByMemberId: string;
  /** When the team released the form to the portal; null exactly while `draft`. */
  releasedAt: string | null;
  /** Member who released the form; null while `draft`. */
  releasedByMemberId: string | null;
  /** Last submission by the customer; stays set through change requests and completion. */
  submittedAt: string | null;
  /** Contact who submitted last; null before the first submission or once the membership was removed. */
  submittedByPortalMembershipId: string | null;
  /** When the customer confirmed the booked services; null while unconfirmed. */
  servicesConfirmedAt: string | null;
  /** Contact who confirmed the services; null while unconfirmed or once the membership was removed. */
  servicesConfirmedByPortalMembershipId: string | null;
  /** Customer remark on the booked services; null when left empty. Never changes the services. */
  servicesNote: string | null;
  /**
   * A project line item changed after the customer confirmed the services. The confirmation stays
   * valid; the team clears it up in the review. Always false while unconfirmed or once completed.
   */
  servicesChangedSinceConfirmation: boolean;
  /** Date of the onboarding call as `YYYY-MM-DD`; required for completion. */
  callHeldOn: string | null;
  /** When the team completed the form; null until `completed`, afterwards read-only for good. */
  completedAt: string | null;
  /** Member who completed the form; null until `completed`. */
  completedByMemberId: string | null;
  /** Steps in form order, each with its block copy and review. */
  blocks: OnboardingFormBlockDto[];
  /** All answer rows of the form. */
  answers: QuestionnaireAnswerDto[];
  /** Attached files this viewer may open; the rest only appears in `hiddenAnswerFiles`. */
  answerFiles: QuestionnaireAnswerFileDto[];
  /**
   * Where files hang that this viewer may not open. They count for completeness like any other
   * file, so the viewer's progress matches the server's; nothing else about them is given away.
   */
  hiddenAnswerFiles: QuestionnaireAnswerFileRefDto[];
  /** All group entries of the form. */
  groupEntries: QuestionnaireGroupEntryDto[];
  /** Current project line items; the frozen snapshot once the form is completed. */
  services: OnboardingFormServiceDto[];
  /** Optimistic-concurrency counter of the form head; answer autosaves do not advance it. */
  version: number;
  /** Creation timestamp supplied by the database. */
  createdAt: string;
  /** Last write to the form head; not the last answer, which is derived from the answer rows. */
  updatedAt: string;
}
