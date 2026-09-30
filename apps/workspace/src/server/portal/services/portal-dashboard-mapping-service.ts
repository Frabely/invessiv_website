import "server-only";

import type { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import type { PortalDashboardDto } from "@invessiv/common/contracts/portal/portal-dashboard.dto";
import type { PortalCustomerTaskDto } from "@invessiv/common/contracts/portal/portal-customer-task.dto";
import type { PortalFeedbackSummaryDto } from "@invessiv/common/contracts/portal/portal-feedback-summary.dto";
import type { PortalTaskDto } from "@invessiv/common/contracts/portal/portal-task.dto";
import { feedbackRoundProgress } from "@invessiv/common/patterns/crm/feedback-round-state";
import { taskDueStateService } from "@/common/patterns/tasks/task-due-state";

type CustomerRow = {
  displayName: string;
  ownerMemberId: string;
  contactName: string | null;
  contactEmail: string | null;
};

type ProjectRow = {
  id: string;
  title: string;
  status: ProjectStatus;
  processSteps: string[];
  currentProcessStep: string;
  feedbackRoundPositions: number[] | null;
  includedFeedbackRounds: number;
  nextStepLabel: string | null;
  nextStepDueOn: string | null;
  previewUrl: string | null;
  ownerMemberId: string;
  ownerName: string | null;
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
  version: number;
};

type RoundRow = {
  projectId: string;
  roundNumber: number;
  status: FeedbackRoundStatus;
  dueOn: string | null;
  approvedAt: Date | null;
};

type DashboardRows = {
  customer: CustomerRow;
  projects: ProjectRow[];
  tasks: TaskRow[];
  /** Rounds of the listed projects; null without `portal.feedback.read`. */
  feedbackRounds: RoundRow[] | null;
  /** Round states only, for the track; loaded with the projects. */
  roundStates: Omit<RoundRow, "dueOn" | "approvedAt">[];
  today: string;
  canCompleteTasks: boolean;
  isOwnerView: boolean;
};

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

/** The latest round decides whose turn it is; a project without round steps has no entry. */
function mapFeedbackSummary(
  project: ProjectRow,
  rounds: readonly RoundRow[],
): PortalFeedbackSummaryDto | null {
  const own = rounds.filter((round) => round.projectId === project.id);
  if (project.includedFeedbackRounds === 0 && own.length === 0) return null;
  const latest = own.reduce<RoundRow | null>(
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
  projects,
  tasks,
  feedbackRounds,
  roundStates,
  today,
  canCompleteTasks,
  isOwnerView,
}: DashboardRows): PortalDashboardDto {
  const currentRows = projects
    .filter((row) => row.status !== ProjectStatus.Completed)
    .sort((a, b) => {
      const rank = (status: ProjectStatus) =>
        status === ProjectStatus.Planned ? 1 : 0;
      return rank(a.status) - rank(b.status);
    });
  const currentProjects = currentRows.map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    processSteps: row.processSteps,
    currentProcessStep: row.currentProcessStep,
    feedbackRoundPositions: row.feedbackRoundPositions ?? [],
    roundProgress: feedbackRoundProgress(
      roundStates.filter((round) => round.projectId === row.id),
    ),
    nextStep:
      row.nextStepLabel !== null || row.nextStepDueOn !== null
        ? { label: row.nextStepLabel, dueOn: row.nextStepDueOn }
        : null,
    previewUrl: row.previewUrl,
    projectLead:
      row.ownerMemberId !== customer.ownerMemberId && row.ownerName !== null
        ? { displayName: row.ownerName }
        : null,
  }));

  const completedProjects = projects
    .filter((row) => row.status === ProjectStatus.Completed)
    .map((row) => ({
      id: row.id,
      title: row.title,
      previewUrl: row.previewUrl,
    }));

  const customerRows = tasks.filter(
    (row) => row.actionSide === TaskActionSide.Customer,
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
          }
        : null,
    projects: currentProjects,
    completedProjects,
    customerTasks: [...openCustomerTasks, ...completedCustomerTasks].map(
      (row): PortalCustomerTaskDto => ({
        ...mapTask(row, today),
        version: row.version,
      }),
    ),
    ourTasks: tasks
      .filter((row) => row.actionSide === TaskActionSide.Internal)
      .map((row) => mapTask(row, today)),
    feedback: feedbackRounds
      ? currentRows
          .map((row) => mapFeedbackSummary(row, feedbackRounds))
          .filter((entry) => entry !== null)
      : null,
    capabilities: { canCompleteTasks, isOwnerView },
  };
}

export const portalDashboardMappingService = { mapRowsToDto } as const;
