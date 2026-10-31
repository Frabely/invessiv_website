import type { OnboardingFormStatus } from "../../../../constants/crm/onboarding/onboarding-form-statuses";
import type { ProjectPhase } from "../../../../constants/crm/project-phases";
import type { Locale } from "@invessiv/common";
import type { OnboardingExportBlockDto } from "./onboarding-export-block.dto";
import type { OnboardingExportServicesDto } from "./onboarding-export-services.dto";

/**
 * `onboarding.json` of an export archive: every question of a form with its answer, as input for
 * deriving a project brief. Unanswered and hidden questions are always part of it.
 */
export interface OnboardingExportDto {
  /** `ONBOARDING_EXPORT_SCHEMA_VERSION` at export time; raised whenever this shape changes. */
  schemaVersion: number;
  /** When the archive was produced; a form still in progress may change afterwards. */
  exportedAt: string;
  /** Locale all labels were resolved in; a text missing there falls back to another maintained one. */
  locale: Locale;
  /** Display name of the customer, not the legal company name. */
  customerName: string;
  /** Title of the project the form belongs to. */
  projectTitle: string;
  /** Phase of the project at export time. */
  projectPhase: ProjectPhase;
  /** Template the form was started from; null when started empty or once the template was deleted. */
  templateTitle: string | null;
  /** Form status at export time; anything before `completed` may still change. */
  status: OnboardingFormStatus;
  /** When the team released the form to the customer; null while `draft`. */
  releasedAt: string | null;
  /** Last submission by the customer; null before the first one. */
  submittedAt: string | null;
  /** Date of the onboarding call as `YYYY-MM-DD`; null until the team completes the form. */
  callHeldOn: string | null;
  /** When the team completed the form; null until `completed`. */
  completedAt: string | null;
  /** The booked services a `project_services` question asks the customer to confirm. */
  services: OnboardingExportServicesDto;
  /** Steps in form order. */
  blocks: OnboardingExportBlockDto[];
}
