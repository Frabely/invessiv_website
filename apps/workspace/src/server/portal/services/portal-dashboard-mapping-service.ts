import "server-only";

import type { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import { PortalTaskRequestLimits } from "@invessiv/common/constants/portal/portal-task-request-limits";
import type { PortalBookingDto } from "@invessiv/common/contracts/portal/portal-booking.dto";
import type { PortalDashboardDto } from "@invessiv/common/contracts/portal/portal-dashboard.dto";
import type { PortalCustomerTaskDto } from "@invessiv/common/contracts/portal/portal-customer-task.dto";
import type { PortalFeedbackSummaryDto } from "@invessiv/common/contracts/portal/portal-feedback-summary.dto";
import type { PortalOurTaskDto } from "@invessiv/common/contracts/portal/portal-our-task.dto";
import type { PortalProjectDto } from "@invessiv/common/contracts/portal/portal-project.dto";
import type { PortalTaskDto } from "@invessiv/common/contracts/portal/portal-task.dto";
import { feedbackRoundProgress } from "@invessiv/common/patterns/crm/feedback-round-state";
import { taskDueStateService } from "@/common/patterns/tasks/task-due-state";

type CustomerRow = {
  displayName: string;
  ownerMemberId: string;
  contactName: string | null;
  contactEmail: string | null;
  booking?: PortalBookingDto | null;
};

type ProjectSummaryRow = {
  id: string;
  title: string;
  status: ProjectStatus;
  previewUrl: string | null;
};

type ProjectRow = ProjectSummaryRow & {
  processSteps: string[];
  currentProcessStep: string;
  feedbackRoundPositions: number[] | null;
  includedFeedbackRounds: number;
  nextStepLabel: string | null;
  nextStepDueOn: string | null;
  ownerMemberId: string;
  ownerName: string | null;
};

type FeedbackProjectRow = {
  id: string;
  title: string;
  includedFeedbackRounds: number;
};

type TaskRow = {
  id: string;
  projectId: string;
  projectTitle: string;
  title: string;
  description: string;
  status: TaskStatus;
  actionSide: TaskActionSide;
  dueOn: string | null;
  completedAt: Date | null;
  completedByPortalMembershipId: string | null;
  createdByPortalMembershipId: string | null;
  updatedAt: Date;
  version: number;
};

type RoundRow = {
  roundNumber: number;
  status: FeedbackRoundStatus;
  dueOn: string | null;
  approvedAt: Date | null;
};

type DashboardRows = {
  customer: CustomerRow;
  selectedProject: ProjectRow | null;
  /** The selection itself; it exists without the project read grant, unlike `selectedProject`. */
  selectedProjectId?: string | null;
  feedbackProject?: FeedbackProjectRow | null;
  /** Every visible project; only the completed ones are listed in the DTO. */
  projectSummaries: readonly ProjectSummaryRow[];
  tasks: TaskRow[];
  /** Rounds of the selected project; the track needs them even without `portal.feedback.read`. */
  rounds: RoundRow[];
  canReadFeedback: boolean;
  today: string;
  canCompleteTasks: boolean;
  canReopenTasks: boolean;
  canCreateTasks: boolean;
  isOwnerView: boolean;
};

/** Open work first, then the latest customer-created tasks the team declined. */
function listOurTaskRows(rows: readonly TaskRow[]): TaskRow[] {
  const internal = rows.filter(
    (row) => row.actionSide === TaskActionSide.Internal,
  );
  const rejected = internal
    .filter(
      (row) =>
        row.status === TaskStatus.Cancelled &&
        row.createdByPortalMembershipId !== null,
    )
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, PortalTaskRequestLimits.RejectedShown);
  return [
    ...internal.filter((row) => row.status !== TaskStatus.Cancelled),
    ...rejected,
  ];
}

function mapTask(row: TaskRow, today: string): PortalTaskDto {
  return {
    id: row.id,
    projectId: row.projectId,
    projectTitle: row.projectTitle,
    title: row.title,
    description: row.description.trim() || null,
    dueOn: row.dueOn,
    dueState: taskDueStateService.dueState(row, today),
    done: row.status === TaskStatus.Done,
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

function mapProject(
  row: ProjectRow,
  customer: CustomerRow,
  rounds: readonly RoundRow[],
): PortalProjectDto {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    processSteps: row.processSteps,
    currentProcessStep: row.currentProcessStep,
    feedbackRoundPositions: row.feedbackRoundPositions ?? [],
    roundProgress: feedbackRoundProgress(rounds),
    nextStep:
      row.nextStepLabel !== null || row.nextStepDueOn !== null
        ? { label: row.nextStepLabel, dueOn: row.nextStepDueOn }
        : null,
    previewUrl: row.previewUrl,
    projectLead:
      row.ownerMemberId !== customer.ownerMemberId && row.ownerName !== null
        ? { displayName: row.ownerName }
        : null,
  };
}

/** The latest round decides whose turn it is; a project without round steps has no summary. */
function mapFeedbackSummary(
  project: FeedbackProjectRow,
  rounds: readonly RoundRow[],
): PortalFeedbackSummaryDto | null {
  if (project.includedFeedbackRounds === 0 && rounds.length === 0) return null;
  const latest = rounds.reduce<RoundRow | null>(
    (highest, round) =>
      !highest || round.roundNumber > highest.roundNumber ? round : highest,
    null,
  );
  return {
    projectId: project.id,
    projectTitle: project.title,
    roundNumber: latest?.roundNumber ?? null,
    status: latest?.status ?? null,
    dueOn: latest?.dueOn ?? null,
    approvedAt: latest?.approvedAt?.toISOString() ?? null,
    included: project.includedFeedbackRounds,
    used: latest?.roundNumber ?? 0,
  };
}

function mapRowsToDto({
  customer,
  selectedProject,
  selectedProjectId = selectedProject?.id ?? null,
  feedbackProject = selectedProject,
  projectSummaries,
  tasks,
  rounds,
  canReadFeedback,
  today,
  canCompleteTasks,
  canReopenTasks,
  canCreateTasks,
  isOwnerView,
}: DashboardRows): PortalDashboardDto {
  const customerRows = tasks.filter(
    (row) =>
      row.actionSide === TaskActionSide.Customer &&
      row.status !== TaskStatus.Cancelled,
  );
  const openCustomerTasks = customerRows.filter(
    (row) => row.status !== TaskStatus.Done,
  );
  // The completion history is bounded in the DTO even when a customer has many older tasks.
  const completedCustomerTasks = customerRows
    .filter((row) => row.status === TaskStatus.Done)
    .sort(
      (a, b) =>
        (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0),
    )
    .slice(0, 20);

  return {
    customer: { displayName: customer.displayName },
    contact:
      customer.contactName !== null && customer.contactEmail !== null
        ? {
            displayName: customer.contactName,
            email: customer.contactEmail,
            booking: customer.booking ?? null,
          }
        : null,
    selectedProjectId,
    project: selectedProject
      ? mapProject(selectedProject, customer, rounds)
      : null,
    completedProjects: projectSummaries
      .filter((row) => row.status === ProjectStatus.Completed)
      .map((row) => ({
        id: row.id,
        title: row.title,
        previewUrl: row.previewUrl,
      })),
    customerTasks: [...openCustomerTasks, ...completedCustomerTasks].map(
      (row): PortalCustomerTaskDto => ({
        ...mapTask(row, today),
        version: row.version,
        // Only a completion made in the portal can be taken back there; the team's stays.
        canReopen:
          canReopenTasks &&
          row.status === TaskStatus.Done &&
          row.completedByPortalMembershipId !== null,
      }),
    ),
    ourTasks: listOurTaskRows(tasks).map((row): PortalOurTaskDto => ({
      ...mapTask(row, today),
      requestedByCustomer: row.createdByPortalMembershipId !== null,
      rejected: row.status === TaskStatus.Cancelled,
    })),
    feedback:
      canReadFeedback && feedbackProject
        ? mapFeedbackSummary(feedbackProject, rounds)
        : null,
    capabilities: { canCompleteTasks, canCreateTasks, isOwnerView },
  };
}

export const portalDashboardMappingService = { mapRowsToDto } as const;
