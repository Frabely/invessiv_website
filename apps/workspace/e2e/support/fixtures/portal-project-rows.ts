import { ProjectBillingModel } from "@invessiv/common/constants/crm/project-billing-models";
import { ProjectPhase } from "@invessiv/common/constants/crm/project-phases";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { ProjectWorkflowKey } from "@invessiv/common/constants/crm/project-workflows";
import { PORTAL_E2E_PREFIX as PREFIX } from "@/common/constants/testing/portal-e2e-prefix";
/** Both rounds sit before "Launch" and the project is at "Entwicklung", so round 2 follows round 1
 * without moving the track, and the approval moves it to "Launch". */
export function feedbackProjectRow(
  id: string,
  customerId: string,
  ownerMemberId: string,
  title: string,
) {
  return {
    id,
    customer_id: customerId,
    owner_member_id: ownerMemberId,
    title: `${PREFIX} ${title}`,
    status: ProjectStatus.Active,
    phase: ProjectPhase.Development,
    process_steps: ["Design", "Entwicklung", "Launch"],
    current_process_step: "Entwicklung",
    workflow_key: ProjectWorkflowKey.StandardWebV1,
    billing_model: ProjectBillingModel.FixedPrice,
    included_feedback_rounds: 2,
    feedback_round_positions: [2, 2],
    feedback_areas: ["Startseite", "Kontakt"],
    preview_url: "https://example.com/preview",
    next_step_label: null,
    next_step_due_on: null,
    started_on: null,
    budget_cents: null,
    hourly_rate_cents: null,
    version: 1,
  };
}
/** A project that only has to exist and be visible in the portal. */
export function plainProjectRow(
  id: string,
  customerId: string,
  ownerMemberId: string,
  title: string,
) {
  return {
    ...feedbackProjectRow(id, customerId, ownerMemberId, title),
    included_feedback_rounds: 0,
    feedback_round_positions: null,
    feedback_areas: [],
  };
}
