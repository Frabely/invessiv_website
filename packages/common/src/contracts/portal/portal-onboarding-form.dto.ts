import type { OnboardingFormStatus } from "../../constants/crm/onboarding/onboarding-form-statuses";
import type { QuestionnaireAnswerFileRefDto } from "../crm/questionnaire/questionnaire-answer-file-ref.dto";
import type { QuestionnaireAnswerFileDto } from "../crm/questionnaire/questionnaire-answer-file.dto";
import type { QuestionnaireAnswerDto } from "../crm/questionnaire/questionnaire-answer.dto";
import type { QuestionnaireGroupEntryDto } from "../crm/questionnaire/questionnaire-group-entry.dto";
import type { PortalOnboardingBlockDto } from "./portal-onboarding-block.dto";
import type { PortalOnboardingServiceDto } from "./portal-onboarding-service.dto";

/** The onboarding form of one project as a contact sees it; a draft never reaches the portal. */
export interface PortalOnboardingFormDto {
  /** Form id; every portal form command addresses this value. */
  id: string;
  /** Project the form belongs to. */
  projectId: string;
  /** Project title shown in the page head. */
  projectTitle: string;
  /** Lifecycle state; never `draft`. */
  status: OnboardingFormStatus;
  /** Last submission; null before the first one. */
  submittedAt: string | null;
  /** Contact who submitted last; null before the first submission or once the membership was removed. */
  submittedByName: string | null;
  /** When the team completed the form; null until `completed`. */
  completedAt: string | null;
  /** Steps in form order with texts in the requested locale. */
  blocks: PortalOnboardingBlockDto[];
  /** All answer rows of the form. */
  answers: QuestionnaireAnswerDto[];
  /** All group entries of the form. */
  groupEntries: QuestionnaireGroupEntryDto[];
  /** Attached files the contact may open. */
  answerFiles: QuestionnaireAnswerFileDto[];
  /**
   * Where files hang that the contact may not open, e.g. taken over from a project the portal
   * does not show. They count for completeness, so the form judges itself as the server does.
   */
  hiddenAnswerFiles: QuestionnaireAnswerFileRefDto[];
  /** Booked services a `project_services` field shows: live line items, the snapshot once completed. */
  services: PortalOnboardingServiceDto[];
  /** Whether the booked services are confirmed; answers a `project_services` field. */
  servicesConfirmed: boolean;
  /** Remark the customer left with the confirmation; null when the services fit as shown. */
  servicesNote: string | null;
  /** Blocks this reader may write answers into right now; empty when the form is locked or read-only. */
  editableBlockIds: string[];
  /** Newest answer of the form; null while nothing was answered. */
  lastEditedAt: string | null;
  /** Contact who wrote that answer; null when the team pre-filled it or the membership was removed. */
  lastEditedByName: string | null;
  /** Whether this reader may save answers and submit; the owner view never may. */
  canSubmit: boolean;
  /** Whether this reader may attach and detach files, which needs `portal.files.read` on top. */
  canAttach: boolean;
}
