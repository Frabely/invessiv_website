import "server-only";
import { and, eq, asc } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { projects } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessScope } from "@/common/patterns/auth/access-scope";
import { canOn } from "@/common/patterns/auth/can-on";
import { crmAccessCondition } from "@/server/workspace/shared/services/crm-access-condition";
import { projectLineItemAssignmentService } from "../services/project-line-item-assignment-service";
export async function listServiceRequestAssignmentProjects(
  customerId: string,
  actor: WorkspaceActor,
) {
  const rows = await getDrizzleDatabaseClient()
    .select({
      id: projects.id,
      title: projects.title,
      status: projects.status,
      feedbackRoundPositions: projects.feedback_round_positions,
    })
    .from(projects)
    .where(
      and(
        eq(projects.customer_id, customerId),
        crmAccessCondition.forScope(
          accessScope(actor, Permission.ProjectLineItemsWrite),
          { customerId: projects.customer_id, projectId: projects.id },
        ),
      ),
    )
    .orderBy(asc(projects.title));
  const blockers = await projectLineItemAssignmentService.listBlockers(
    actor,
    customerId,
    rows.map((r) => ({
      ...r,
      feedbackRoundPositions: r.feedbackRoundPositions ?? [],
      hasReadableTrack: canOn(actor, Permission.ProjectsWrite, {
        customerId,
        projectId: r.id,
      }),
    })),
  );
  return {
    projects: rows.map((r) => ({ id: r.id, title: r.title })),
    blockers,
  };
}
