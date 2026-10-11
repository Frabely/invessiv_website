import "server-only";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ExtraFeedbackRoundBlocker } from "@invessiv/common/constants/crm/extra-feedback-round-blockers";
import { HOURS_CLOSED_PROJECT_STATUS_VALUES } from "@invessiv/common/constants/crm/hours-closed-project-statuses";
import { can } from "@invessiv/common/patterns/auth/can";
import { calculateProjectLineItemValue } from "@invessiv/common/patterns/crm/project-line-item-value";
import { LineItemAssignmentBlocker } from "@/common/constants/crm/line-item-assignment-blockers";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import type { CockpitProjectDto } from "@/common/contracts/crm/cockpit-project.dto";
import type { LineItemAssignmentBlockers } from "@/common/contracts/crm/line-item-assignment-blockers";
import type { ProjectLineItemsViewModel } from "@/common/contracts/crm/project-line-items-view-model";
import { canOn } from "@/common/patterns/auth/can-on";
import { listAssignableLineItemTemplates } from "@/server/workspace/crm/query-handler/list-assignable-line-item-templates.query-handler";
import { listExtraFeedbackRoundBlockers } from "@/server/workspace/crm/query-handler/list-extra-feedback-round-blockers.query-handler";
import { listProjectLineItemsByCustomer } from "@/server/workspace/crm/query-handler/list-project-line-items-by-customer.query-handler";

const ROUND_BLOCKER: Record<
  ExtraFeedbackRoundBlocker,
  LineItemAssignmentBlocker
> = {
  [ExtraFeedbackRoundBlocker.ProjectApproved]:
    LineItemAssignmentBlocker.ProjectApproved,
  [ExtraFeedbackRoundBlocker.LimitReached]:
    LineItemAssignmentBlocker.LimitReached,
};

/**
 * What stands in the way of the two template kinds that act on a project, per writable project.
 * A project the actor cannot read as a whole is treated as not writable for a further round: its
 * track is unknown here, and the command would refuse it anyway.
 */
async function buildAssignmentBlockers(
  actor: WorkspaceActor,
  customerId: string,
  projects: readonly CockpitProjectDto[],
): Promise<Record<string, LineItemAssignmentBlockers>> {
  const canManageHours = canOn(actor, Permission.HoursManage, { customerId });
  const roundCandidates = projects.filter(
    (candidate) =>
      candidate.project !== null &&
      canOn(actor, Permission.ProjectsWrite, {
        customerId,
        projectId: candidate.id,
      }),
  );
  const roundBlockers = await listExtraFeedbackRoundBlockers(
    roundCandidates.map((candidate) => ({
      id: candidate.id,
      positions: candidate.project?.feedbackRoundPositions ?? [],
    })),
  );
  return Object.fromEntries(
    projects.map((candidate) => {
      const roundBlocker = roundBlockers.get(candidate.id);
      const blockers: LineItemAssignmentBlockers = {
        hours: !canManageHours
          ? LineItemAssignmentBlocker.MissingHoursPermission
          : candidate.project &&
              HOURS_CLOSED_PROJECT_STATUS_VALUES.includes(
                candidate.project.status,
              )
            ? LineItemAssignmentBlocker.ProjectClosed
            : null,
        feedbackRound:
          roundBlocker === undefined
            ? LineItemAssignmentBlocker.MissingProjectPermission
            : roundBlocker
              ? ROUND_BLOCKER[roundBlocker]
              : null,
      };
      return [candidate.id, blockers];
    }),
  );
}

/**
 * Collects the services of a customer's projects together with the per-project rights, so the
 * cockpit can decide what to show without asking the server again when it switches projects.
 * Returns null when no project of this customer is readable — the area then stays hidden.
 */
export async function buildProjectLineItemsViewModel(options: {
  actor: WorkspaceActor;
  catalogHref: string | null;
  customerId: string;
  projects: readonly CockpitProjectDto[];
}): Promise<ProjectLineItemsViewModel | null> {
  const { actor, catalogHref, customerId, projects } = options;
  const readableProjectIds = projects
    .filter((project) =>
      canOn(actor, Permission.ProjectLineItemsRead, {
        customerId,
        projectId: project.id,
      }),
    )
    .map((project) => project.id);
  if (readableProjectIds.length === 0) return null;

  const writableProjects = projects.filter((project) =>
    canOn(actor, Permission.ProjectLineItemsWrite, {
      customerId,
      projectId: project.id,
    }),
  );
  const writableProjectIds = writableProjects.map((project) => project.id);

  // The picker only ever offers active templates, and only catalog readers may receive them.
  // A project-scoped write grant must not disclose the workspace-wide catalog.
  const [services, assignableTemplates, assignmentBlockersByProjectId] =
    await Promise.all([
      listProjectLineItemsByCustomer(customerId, actor),
      writableProjectIds.length > 0 &&
      can(actor, Permission.LineItemTemplatesRead)
        ? listAssignableLineItemTemplates()
        : Promise.resolve([]),
      buildAssignmentBlockers(actor, customerId, writableProjects),
    ]);
  const valuesByProjectId = Object.fromEntries(
    readableProjectIds.map((projectId) => [
      projectId,
      calculateProjectLineItemValue(
        services.filter((service) => service.projectId === projectId),
      ),
    ]),
  );

  return {
    services,
    readableProjectIds,
    writableProjectIds,
    assignableTemplates,
    assignmentBlockersByProjectId,
    catalogHref,
    customerValue: calculateProjectLineItemValue(services),
    valuesByProjectId,
  };
}
