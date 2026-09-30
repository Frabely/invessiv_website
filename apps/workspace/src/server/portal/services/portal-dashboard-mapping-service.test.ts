import { describe, expect, it, vi } from "vitest";

import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import { TaskDueState } from "@invessiv/common/constants/crm/task-due-states";
import { portalDashboardMappingService } from "./portal-dashboard-mapping-service";

vi.mock("server-only", () => ({}));

const customer = {
  displayName: "Example GmbH",
  ownerMemberId: "member-1",
  contactName: "Alex Example",
  contactEmail: "alex@example.test",
};

function project(status: ProjectStatus, ownerMemberId = "member-1") {
  return {
    id: `${status}-project`,
    title: status,
    status,
    processSteps: ["Start", "Finish"],
    currentProcessStep: "Start",
    feedbackRoundPositions: [1, 1] as number[] | null,
    includedFeedbackRounds: 2,
    nextStepLabel: null,
    nextStepDueOn: null,
    previewUrl: null,
    ownerMemberId,
    ownerName: "Other lead",
  };
}

function task(index: number, status: TaskStatus, actionSide: TaskActionSide) {
  return {
    id: `task-${index}`,
    projectId: "project-1",
    projectTitle: "Website",
    title: `Task ${index}`,
    description: "  ",
    status,
    actionSide,
    dueOn: "2026-09-20",
    completedAt:
      status === TaskStatus.Done
        ? new Date(`2026-09-${String(index + 1).padStart(2, "0")}T10:00:00Z`)
        : null,
    version: 3,
  };
}

describe("portalDashboardMappingService.mapRowsToDto", () => {
  it("separates completed projects, hides matching leads, and maps public fields only", () => {
    const dto = portalDashboardMappingService.mapRowsToDto({
      customer,
      projects: [
        project(ProjectStatus.Planned),
        project(ProjectStatus.Active, "member-2"),
        project(ProjectStatus.Completed),
      ],
      tasks: [
        task(0, TaskStatus.Open, TaskActionSide.Customer),
        task(1, TaskStatus.InProgress, TaskActionSide.Internal),
      ],
      feedbackRounds: [],
      roundStates: [],
      today: "2026-09-26",
      canCompleteTasks: true,
      isOwnerView: false,
    });

    expect(dto.projects.map((row) => row.status)).toEqual([
      ProjectStatus.Active,
      ProjectStatus.Planned,
    ]);
    expect(dto.projects[0]?.projectLead).toEqual({ displayName: "Other lead" });
    expect(dto.projects[1]?.projectLead).toBeNull();
    expect(dto.completedProjects).toEqual([
      { id: "completed-project", title: "completed", previewUrl: null },
    ]);
    expect(dto.customerTasks[0]).toEqual({
      id: "task-0",
      projectId: "project-1",
      projectTitle: "Website",
      title: "Task 0",
      description: null,
      dueOn: "2026-09-20",
      dueState: TaskDueState.Overdue,
      done: false,
      completedAt: null,
      version: 3,
    });
    expect(dto.ourTasks[0]).not.toHaveProperty("version");
    expect(dto).not.toHaveProperty("ownerMemberId");
    expect(JSON.stringify(dto)).not.toMatch(/member-1|member-2/);
  });

  it("keeps only the 20 most recent completed customer tasks", () => {
    const tasks = Array.from({ length: 22 }, (_, index) =>
      task(index, TaskStatus.Done, TaskActionSide.Customer),
    );
    const dto = portalDashboardMappingService.mapRowsToDto({
      customer,
      projects: [],
      tasks,
      feedbackRounds: null,
      roundStates: [],
      today: "2026-09-26",
      canCompleteTasks: false,
      isOwnerView: true,
    });

    expect(dto.customerTasks).toHaveLength(20);
    expect(dto.customerTasks[0]?.id).toBe("task-21");
    expect(dto.customerTasks.at(-1)?.id).toBe("task-2");
  });
});

describe("portalDashboardMappingService feedback rounds", () => {
  function map(feedbackRoundPositions: number[] | null) {
    return portalDashboardMappingService.mapRowsToDto({
      customer,
      projects: [{ ...project(ProjectStatus.Active), feedbackRoundPositions }],
      tasks: [],
      feedbackRounds: null,
      roundStates: [],
      today: "2026-09-26",
      canCompleteTasks: false,
      isOwnerView: false,
    });
  }

  it("exposes the round positions", () => {
    expect(map([0, 1, 1]).projects[0]?.feedbackRoundPositions).toEqual([
      0, 1, 1,
    ]);
  });

  it("maps a project from before the rounds column to no rounds", () => {
    expect(map(null).projects[0]?.feedbackRoundPositions).toEqual([]);
  });
});

describe("portalDashboardMappingService feedback summary", () => {
  const rounds = [
    {
      projectId: "active-project",
      roundNumber: 1,
      status: FeedbackRoundStatus.Completed,
      dueOn: "2026-09-10",
    },
    {
      projectId: "active-project",
      roundNumber: 2,
      status: FeedbackRoundStatus.Open,
      dueOn: "2026-10-14",
    },
  ];

  function map(feedbackRounds: typeof rounds | null) {
    return portalDashboardMappingService.mapRowsToDto({
      customer,
      projects: [
        project(ProjectStatus.Active),
        { ...project(ProjectStatus.Planned), includedFeedbackRounds: 0 },
        { ...project(ProjectStatus.Paused), feedbackRoundPositions: [1] },
        project(ProjectStatus.Completed),
      ],
      tasks: [],
      feedbackRounds,
      roundStates: rounds,
      today: "2026-09-26",
      canCompleteTasks: false,
      isOwnerView: false,
    });
  }

  it("summarizes the latest round of every current project with round steps", () => {
    expect(map(rounds).feedback).toEqual([
      {
        projectId: "active-project",
        projectTitle: "active",
        roundNumber: 2,
        status: FeedbackRoundStatus.Open,
        dueOn: "2026-10-14",
        included: 2,
        used: 2,
      },
      {
        projectId: "paused-project",
        projectTitle: "paused",
        roundNumber: null,
        status: null,
        dueOn: null,
        included: 2,
        used: 0,
      },
    ]);
  });

  it("has no feedback entries without the read permission", () => {
    expect(map(null).feedback).toBeNull();
  });

  it("derives the track progress from the round states alone", () => {
    const dto = map(null);
    expect(dto.projects[0]?.roundProgress).toEqual({
      activeRoundNumber: 2,
      completedRoundNumber: 1,
      approvedRoundNumber: null,
    });
    expect(dto.projects[1]?.roundProgress).toEqual({
      activeRoundNumber: null,
      completedRoundNumber: null,
      approvedRoundNumber: null,
    });
  });
});
