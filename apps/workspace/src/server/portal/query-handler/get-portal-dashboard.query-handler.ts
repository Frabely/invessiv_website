import "server-only";

import { and, desc, eq, inArray, ne } from "drizzle-orm";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import type { PortalDashboardDto } from "@invessiv/common/contracts/portal/portal-dashboard.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  customers,
  feedbackRounds,
  projects,
  tasks,
  users,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { isPortalOwnerView } from "@/server/portal/auth/portal-owner-view";
import { portalCanOn } from "@/server/portal/shared/portal-can-on";
import { portalAccessCondition } from "@/server/portal/shared/portal-access-condition";
import { portalProjectCondition } from "@/server/portal/shared/portal-project-condition";
import { portalDashboardMappingService } from "@/server/portal/services/portal-dashboard-mapping-service";
import { portalFeedbackService } from "@/server/portal/services/feedback/portal-feedback-service";

/**
 * Reads only explicitly released dashboard columns in at most four queries. Round states feed the
 * track of every visible project; due dates and the widget need `portal.feedback.read` as well.
 */
export async function getPortalDashboard(
  reader: PortalReader,
  today: string,
): Promise<PortalDashboardDto> {
  const db = getDrizzleDatabaseClient();
  const target = { customerId: reader.customerId };
  const customerRows = await db
    .select({
      displayName: customers.display_name,
      ownerMemberId: customers.owner_member_id,
      contactName: users.display_name,
      contactEmail: users.primary_email,
    })
    .from(customers)
    .leftJoin(
      workspaceMembers,
      eq(workspaceMembers.id, customers.owner_member_id),
    )
    .leftJoin(users, eq(users.id, workspaceMembers.user_id))
    .where(
      portalAccessCondition.forReader(reader, Permission.PortalAccess, {
        customerId: customers.id,
      }),
    )
    .limit(1);

  const customer = customerRows[0];
  if (!customer) throw new Error("Portal customer is unavailable.");

  const projectRows = portalCanOn.forReader(
    reader,
    Permission.PortalProjectsRead,
    target,
  )
    ? await db
        .select({
          id: projects.id,
          title: projects.title,
          status: projects.status,
          processSteps: projects.process_steps,
          currentProcessStep: projects.current_process_step,
          feedbackRoundPositions: projects.feedback_round_positions,
          includedFeedbackRounds: projects.included_feedback_rounds,
          nextStepLabel: projects.next_step_label,
          nextStepDueOn: projects.next_step_due_on,
          previewUrl: projects.preview_url,
          ownerMemberId: projects.owner_member_id,
          ownerName: users.display_name,
        })
        .from(projects)
        .leftJoin(
          workspaceMembers,
          eq(workspaceMembers.id, projects.owner_member_id),
        )
        .leftJoin(users, eq(users.id, workspaceMembers.user_id))
        .where(portalProjectCondition(reader, Permission.PortalProjectsRead))
        .orderBy(desc(projects.created_at))
    : [];

  const roundRows = projectRows.length
    ? await db
        .select({
          projectId: feedbackRounds.project_id,
          roundNumber: feedbackRounds.round_number,
          status: feedbackRounds.status,
          dueOn: feedbackRounds.due_on,
          approvedAt: feedbackRounds.approved_at,
        })
        .from(feedbackRounds)
        .where(
          inArray(
            feedbackRounds.project_id,
            projectRows.map((row) => row.id),
          ),
        )
    : [];
  const canReadFeedback = portalFeedbackService.canRead(reader);

  const taskRows = portalCanOn.forReader(
    reader,
    Permission.PortalTasksRead,
    target,
  )
    ? await db
        .select({
          id: tasks.id,
          projectId: tasks.project_id,
          projectTitle: projects.title,
          title: tasks.title,
          description: tasks.description,
          status: tasks.status,
          actionSide: tasks.action_side,
          dueOn: tasks.due_on,
          completedAt: tasks.completed_at,
          version: tasks.version,
        })
        .from(tasks)
        .innerJoin(projects, eq(projects.id, tasks.project_id))
        .where(
          and(
            portalProjectCondition(reader, Permission.PortalTasksRead),
            eq(tasks.visible_to_customer, true),
            ne(tasks.status, TaskStatus.Cancelled),
          ),
        )
    : [];

  return portalDashboardMappingService.mapRowsToDto({
    customer,
    projects: projectRows,
    tasks: taskRows,
    feedbackRounds: canReadFeedback ? roundRows : null,
    roundStates: roundRows.map(({ projectId, roundNumber, status }) => ({
      projectId,
      roundNumber,
      status,
    })),
    today,
    canCompleteTasks:
      !isPortalOwnerView(reader) &&
      portalCanOn.forReader(reader, Permission.PortalTasksRead, target) &&
      portalCanOn.forReader(reader, Permission.PortalTasksComplete, target),
    isOwnerView: isPortalOwnerView(reader),
  });
}
