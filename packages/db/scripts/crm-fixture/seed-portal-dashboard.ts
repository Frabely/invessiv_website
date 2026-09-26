import { randomUUID } from "node:crypto";
import { ProjectBillingModel } from "@invessiv/common/constants/crm/project-billing-models";
import { ProjectPhase } from "@invessiv/common/constants/crm/project-phases";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { ProjectWorkflowKey } from "@invessiv/common/constants/crm/project-workflows";
import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { projects, tasks } from "@invessiv/db/record-configuration";

type DashboardFixtureInput = {
  ownerMemberId: string;
  projectOwnerMemberId: string;
  memberships: readonly { customerId: string; membershipId: string }[];
};

function dateOffsetFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Seeds each portal company once; the caller owns fixture cleanup and the transaction. */
export async function seedPortalDashboard(
  tx: ContactDatabaseTransaction,
  { ownerMemberId, projectOwnerMemberId, memberships }: DashboardFixtureInput,
) {
  const activeProjectIds = new Map<string, string>();
  const completingMemberships = new Map(
    memberships.map(({ customerId, membershipId }) => [
      customerId,
      membershipId,
    ]),
  );

  for (const [customerId, membershipId] of completingMemberships) {
    const projectId = randomUUID();
    activeProjectIds.set(customerId, projectId);
    const projectBase = {
      customer_id: customerId,
      owner_member_id: ownerMemberId,
      phase: ProjectPhase.Development,
      process_steps: [ProjectPhase.Onboarding, ProjectPhase.Development],
      current_process_step: ProjectPhase.Development,
      workflow_key: ProjectWorkflowKey.StandardWebV1,
      billing_model: ProjectBillingModel.FixedPrice,
      included_feedback_rounds: 2,
      preview_url: null,
      next_step_label: null,
      next_step_due_on: null,
      started_on: null,
      budget_cents: null,
      hourly_rate_cents: null,
      version: 1,
    };
    await tx.insert(projects).values([
      {
        ...projectBase,
        id: projectId,
        title: "Website-Relaunch",
        status: ProjectStatus.Active,
        owner_member_id: projectOwnerMemberId,
        next_step_label: "Erste Website-Version abstimmen",
        next_step_due_on: dateOffsetFromToday(7),
        started_on: dateOffsetFromToday(-14),
      },
      {
        ...projectBase,
        id: randomUUID(),
        title: "Inhalte überarbeiten",
        status: ProjectStatus.Paused,
      },
      {
        ...projectBase,
        id: randomUUID(),
        title: "Landingpage vorbereiten",
        status: ProjectStatus.Planned,
        phase: ProjectPhase.Onboarding,
        current_process_step: ProjectPhase.Onboarding,
      },
      {
        ...projectBase,
        id: randomUUID(),
        title: "Kampagnenseite",
        status: ProjectStatus.Completed,
        preview_url: "https://example.test/fixture-campaign",
      },
      {
        ...projectBase,
        id: randomUUID(),
        title: "Archiviertes Projekt",
        status: ProjectStatus.Archived,
      },
      {
        ...projectBase,
        id: randomUUID(),
        title: "Abgebrochener Entwurf",
        status: ProjectStatus.Cancelled,
      },
    ]);

    const taskBase = {
      project_id: projectId,
      description: "",
      assignee_member_id: ownerMemberId,
      completed_at: null,
      completed_by_member_id: null,
      completed_by_portal_membership_id: null,
      version: 1,
    };
    await tx.insert(tasks).values([
      {
        ...taskBase,
        id: randomUUID(),
        title: "Zugangsdaten zum Hosting bereitstellen",
        status: TaskStatus.Open,
        action_side: TaskActionSide.Customer,
        visible_to_customer: true,
        due_on: dateOffsetFromToday(-3),
      },
      {
        ...taskBase,
        id: randomUUID(),
        title: "Texte für die Unterseiten freigeben",
        status: TaskStatus.Open,
        action_side: TaskActionSide.Customer,
        visible_to_customer: true,
        due_on: dateOffsetFromToday(4),
      },
      {
        ...taskBase,
        id: randomUUID(),
        title: "Logo und Farbwelt klären",
        status: TaskStatus.Done,
        action_side: TaskActionSide.Customer,
        visible_to_customer: true,
        due_on: dateOffsetFromToday(-10),
        completed_at: new Date(),
        completed_by_portal_membership_id: membershipId,
      },
      {
        ...taskBase,
        id: randomUUID(),
        title: "Startseite umsetzen",
        status: TaskStatus.InProgress,
        action_side: TaskActionSide.Internal,
        visible_to_customer: true,
        due_on: dateOffsetFromToday(2),
      },
      {
        ...taskBase,
        id: randomUUID(),
        title: "Kontaktformular vorbereiten",
        status: TaskStatus.Open,
        action_side: TaskActionSide.Internal,
        visible_to_customer: true,
        due_on: dateOffsetFromToday(5),
      },
      {
        ...taskBase,
        id: randomUUID(),
        title: "Analytics einrichten",
        status: TaskStatus.Open,
        action_side: TaskActionSide.Internal,
        visible_to_customer: false,
        due_on: null,
      },
      {
        ...taskBase,
        id: randomUUID(),
        title: "Blog-Bereich vorbereiten",
        status: TaskStatus.Cancelled,
        action_side: TaskActionSide.Internal,
        visible_to_customer: false,
        due_on: null,
      },
    ]);
  }

  return activeProjectIds;
}
