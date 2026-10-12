import { randomUUID } from "node:crypto";
import { ProjectBillingModel } from "@invessiv/common/constants/crm/project-billing-models";
import { ProjectPhase } from "@invessiv/common/constants/crm/project-phases";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { ProjectWorkflowKey } from "@invessiv/common/constants/crm/project-workflows";
import { type ContactDatabaseTransaction } from "@invessiv/db/core";
import { projects } from "@invessiv/db/record-configuration";
import { PORTAL_E2E_PREFIX as PREFIX } from "@/common/constants/testing/portal-e2e-prefix";
import type { PortalE2eSeed } from "@/common/contracts/testing/portal-e2e-seed";
import { feedbackProjectRow } from "./portal-project-rows";
export async function insertProjects(
  tx: ContactDatabaseTransaction,
  seed: PortalE2eSeed,
) {
  const {
    managerMemberId,
    customerB,
    credentialsCustomer,
    credentialsProject,
    credentialsHiddenProject,
    feedbackCustomer,
    feedbackProject,
    feedbackApprovalProject,
    onboardingProject,
    taskProject,
  } = seed;
  await tx.insert(projects).values([
    {
      ...feedbackProjectRow(
        credentialsProject,
        credentialsCustomer,
        managerMemberId,
        "Credentials visible",
      ),
      included_feedback_rounds: 0,
      feedback_round_positions: null,
      feedback_areas: [],
    },
    {
      ...feedbackProjectRow(
        credentialsHiddenProject,
        credentialsCustomer,
        managerMemberId,
        "Credentials hidden",
      ),
      status: ProjectStatus.Archived,
      included_feedback_rounds: 0,
      feedback_round_positions: null,
      feedback_areas: [],
    },
    feedbackProjectRow(
      feedbackProject,
      feedbackCustomer,
      managerMemberId,
      "Feedback-Website",
    ),
    feedbackProjectRow(
      feedbackApprovalProject,
      feedbackCustomer,
      managerMemberId,
      "Feedback-Freigabe",
    ),
    // No round steps: the project stays out of the feedback widget and its tests.
    {
      ...feedbackProjectRow(
        onboardingProject,
        feedbackCustomer,
        managerMemberId,
        "Onboarding-Website",
      ),
      included_feedback_rounds: 0,
      feedback_round_positions: null,
      feedback_areas: [],
    },
    {
      ...feedbackProjectRow(
        taskProject,
        feedbackCustomer,
        managerMemberId,
        "Portal-Aufgaben-Test",
      ),
      included_feedback_rounds: 0,
      feedback_round_positions: null,
      feedback_areas: [],
    },
  ]);
  // Customer B: one feedback round after the design and two before the launch.
  await tx.insert(projects).values({
    id: randomUUID(),
    customer_id: customerB,
    owner_member_id: managerMemberId,
    title: `${PREFIX} Website-Relaunch`,
    status: ProjectStatus.Active,
    phase: ProjectPhase.Development,
    process_steps: ["Onboarding", "Design", "Entwicklung", "Launch", "Wartung"],
    current_process_step: "Entwicklung",
    workflow_key: ProjectWorkflowKey.StandardWebV1,
    billing_model: ProjectBillingModel.FixedPrice,
    included_feedback_rounds: 3,
    feedback_round_positions: [2, 3, 3],
    preview_url: null,
    next_step_label: null,
    next_step_due_on: null,
    started_on: null,
    budget_cents: null,
    hourly_rate_cents: null,
    version: 1,
  });
}
