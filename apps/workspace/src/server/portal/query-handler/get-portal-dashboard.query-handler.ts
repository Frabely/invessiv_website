import "server-only";

import { and, desc, eq, inArray, isNotNull, type SQL } from "drizzle-orm";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import {
  OPEN_TASK_STATUS_VALUES,
  TaskStatus,
} from "@invessiv/common/constants/crm/task-statuses";
import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { PortalTaskRequestLimits } from "@invessiv/common/constants/portal/portal-task-request-limits";
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
import { portalProjectService } from "@/server/portal/services/portal-project-service";
import { projectResponsibleMemberService } from "@/server/shared/services/project-responsible-member-service";
import { portalBookingMappingService } from "@/server/portal/services/portal-booking-mapping-service";
import { selectPortalCurrentProject } from "@/common/patterns/portal/select-portal-current-project";

/** Fetch active work and bounded completed/declined histories for one project. */
async function loadPortalTaskRows(reader: PortalReader, projectId: string) {
  const db = getDrizzleDatabaseClient();
  const columns = {
    id: tasks.id,
    projectId: tasks.project_id,
    projectTitle: projects.title,
    title: tasks.title,
    description: tasks.description,
    status: tasks.status,
    actionSide: tasks.action_side,
    dueOn: tasks.due_on,
    completedAt: tasks.completed_at,
    completedByPortalMembershipId: tasks.completed_by_portal_membership_id,
    createdByPortalMembershipId: tasks.created_by_portal_membership_id,
    updatedAt: tasks.updated_at,
    version: tasks.version,
  };
  const scope = and(
    portalProjectCondition(reader, Permission.PortalTasksRead),
    eq(tasks.project_id, projectId),
    eq(tasks.visible_to_customer, true),
  );
  const select = (condition: SQL | undefined) =>
    db
      .select(columns)
      .from(tasks)
      .innerJoin(projects, eq(projects.id, tasks.project_id))
      .where(and(scope, condition));

  const [active, customerCompleted, teamCompleted, rejected] =
    await Promise.all([
      select(inArray(tasks.status, OPEN_TASK_STATUS_VALUES)),
      select(
        and(
          eq(tasks.status, TaskStatus.Done),
          eq(tasks.action_side, TaskActionSide.Customer),
        ),
      )
        .orderBy(desc(tasks.completed_at), desc(tasks.id))
        .limit(PortalTaskRequestLimits.CustomerCompletedShown),
      select(
        and(
          eq(tasks.status, TaskStatus.Done),
          eq(tasks.action_side, TaskActionSide.Internal),
        ),
      )
        .orderBy(desc(tasks.completed_at), desc(tasks.id))
        .limit(PortalTaskRequestLimits.CompletedShown),
      select(
        and(
          eq(tasks.status, TaskStatus.Cancelled),
          eq(tasks.action_side, TaskActionSide.Internal),
          isNotNull(tasks.created_by_portal_membership_id),
        ),
      )
        .orderBy(desc(tasks.updated_at), desc(tasks.id))
        .limit(PortalTaskRequestLimits.RejectedShown),
    ]);
  return [...active, ...customerCompleted, ...teamCompleted, ...rejected];
}

/**
 * Reads project summaries for selection and completed work, then details, rounds, tasks and the
 * booking contact only for the selected project.
 */
export async function getPortalDashboard(
  reader: PortalReader,
  today: string,
  requestedProjectId?: string | null,
): Promise<PortalDashboardDto> {
  const db = getDrizzleDatabaseClient();
  const target = { customerId: reader.customerId };
  const canReadProjects = portalCanOn.forReader(
    reader,
    Permission.PortalProjectsRead,
    target,
  );
  const canReadFeedback = portalFeedbackService.canRead(reader);
  const [customerRows, selectableSummaries] = await Promise.all([
    db
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
      .limit(1),
    portalProjectService.listSelectableSummaries(reader),
  ]);

  const customer = customerRows[0];
  if (!customer) throw new Error("Portal customer is unavailable.");

  const selectedProjectId =
    selectPortalCurrentProject(
      portalProjectService.toCurrent(selectableSummaries),
      requestedProjectId,
    )?.id ?? null;
  const projectSummaries = canReadProjects ? selectableSummaries : [];

  const [
    selectedProjectRows = [],
    feedbackProjectRows = [],
    roundRows = [],
    bookingContact = null,
    taskRows = [],
  ] = selectedProjectId
    ? await Promise.all([
        canReadProjects
          ? db
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
                ownerEmail: users.primary_email,
                ownerActive: workspaceMembers.active,
              })
              .from(projects)
              .leftJoin(
                workspaceMembers,
                eq(workspaceMembers.id, projects.owner_member_id),
              )
              .leftJoin(users, eq(users.id, workspaceMembers.user_id))
              .where(
                and(
                  portalProjectCondition(reader, Permission.PortalProjectsRead),
                  eq(projects.id, selectedProjectId),
                ),
              )
              .limit(1)
          : [],
        canReadFeedback && !canReadProjects
          ? db
              .select({
                id: projects.id,
                title: projects.title,
                includedFeedbackRounds: projects.included_feedback_rounds,
              })
              .from(projects)
              .where(
                and(
                  portalProjectCondition(reader, Permission.PortalFeedbackRead),
                  eq(projects.id, selectedProjectId),
                ),
              )
              .limit(1)
          : [],
        canReadProjects || canReadFeedback
          ? db
              .select({
                roundNumber: feedbackRounds.round_number,
                status: feedbackRounds.status,
                dueOn: feedbackRounds.due_on,
                approvedAt: feedbackRounds.approved_at,
              })
              .from(feedbackRounds)
              .where(eq(feedbackRounds.project_id, selectedProjectId))
          : [],
        canReadProjects
          ? projectResponsibleMemberService.findBookingContact(
              db,
              selectedProjectId,
            )
          : null,
        portalCanOn.forReader(reader, Permission.PortalTasksRead, target)
          ? loadPortalTaskRows(reader, selectedProjectId)
          : [],
      ])
    : [];
  // Task writes need a selected project and a contact; the owner view never writes.
  const canWrite = (permission: Permission) =>
    !isPortalOwnerView(reader) &&
    selectedProjectId !== null &&
    portalCanOn.forReader(reader, permission, target);
  // The project can vanish between the list and its detail; nothing of it is shown then.
  const selectedProject = selectedProjectRows[0] ?? null;
  const feedbackProject = selectedProject ?? feedbackProjectRows[0] ?? null;
  const projectContact =
    selectedProject?.ownerActive &&
    selectedProject.ownerName &&
    selectedProject.ownerEmail
      ? { name: selectedProject.ownerName, email: selectedProject.ownerEmail }
      : null;

  return portalDashboardMappingService.mapRowsToDto({
    customer: {
      ...customer,
      contactName: projectContact?.name ?? customer.contactName,
      contactEmail: projectContact?.email ?? customer.contactEmail,
      booking:
        selectedProject && bookingContact
          ? portalBookingMappingService.toDto(bookingContact)
          : null,
    },
    selectedProject,
    selectedProjectId,
    projectSummaries,
    tasks: selectedProjectId ? taskRows : [],
    rounds: selectedProjectId ? roundRows : [],
    feedbackProject,
    canReadFeedback,
    today,
    canCompleteTasks: canWrite(Permission.PortalTasksComplete),
    canReopenTasks: canWrite(Permission.PortalTasksReopen),
    canCreateTasks: canWrite(Permission.PortalTasksCreate),
    isOwnerView: isPortalOwnerView(reader),
  });
}
