import "server-only";

import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import type { PortalDashboardDto } from "@invessiv/common/contracts/portal/portal-dashboard.dto";
import type { PortalCustomerTaskDto } from "@invessiv/common/contracts/portal/portal-customer-task.dto";
import type { PortalTaskDto } from "@invessiv/common/contracts/portal/portal-task.dto";
import { taskDueStateService } from "@/common/patterns/tasks/task-due-state";

type CustomerRow = {
  displayName: string;
  ownerMemberId: string;
  contactName: string | null;
  contactEmail: string | null;
  greetingName: string | null;
};

type ProjectRow = {
  id: string;
  title: string;
  status: ProjectStatus;
  processSteps: string[];
  currentProcessStep: string;
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

type DashboardRows = {
  customer: CustomerRow;
  projects: ProjectRow[];
  tasks: TaskRow[];
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

function mapRowsToDto({
  customer,
  projects,
  tasks,
  today,
  canCompleteTasks,
  isOwnerView,
}: DashboardRows): PortalDashboardDto {
  const currentProjects = projects
    .filter((row) => row.status !== ProjectStatus.Completed)
    .sort((a, b) => {
      const rank = (status: ProjectStatus) =>
        status === ProjectStatus.Planned ? 1 : 0;
      return rank(a.status) - rank(b.status);
    })
    .map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      processSteps: row.processSteps,
      currentProcessStep: row.currentProcessStep,
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
    greetingName: isOwnerView ? null : customer.greetingName,
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
    capabilities: { canCompleteTasks, isOwnerView },
  };
}

export const portalDashboardMappingService = { mapRowsToDto } as const;
