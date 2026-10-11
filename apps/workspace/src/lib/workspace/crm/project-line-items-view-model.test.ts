import { beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ProjectBillingModel } from "@invessiv/common/constants/crm/project-billing-models";
import { ProjectPhase } from "@invessiv/common/constants/crm/project-phases";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { ProjectWorkflowKey } from "@invessiv/common/constants/crm/project-workflows";
import type { ProjectDto } from "@invessiv/common/contracts/crm/project.dto";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { buildProjectLineItemsViewModel } from "./project-line-items-view-model";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  listProjectLineItemsByCustomer: vi.fn(),
  listAssignableLineItemTemplates: vi.fn(),
  listExtraFeedbackRoundBlockers: vi.fn(),
}));

vi.mock(
  "@/server/workspace/crm/query-handler/list-project-line-items-by-customer.query-handler",
  () => ({
    listProjectLineItemsByCustomer: mocks.listProjectLineItemsByCustomer,
  }),
);
vi.mock(
  "@/server/workspace/crm/query-handler/list-assignable-line-item-templates.query-handler",
  () => ({
    listAssignableLineItemTemplates: mocks.listAssignableLineItemTemplates,
  }),
);

vi.mock(
  "@/server/workspace/crm/query-handler/list-extra-feedback-round-blockers.query-handler",
  () => ({
    listExtraFeedbackRoundBlockers: mocks.listExtraFeedbackRoundBlockers,
  }),
);

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const PROJECT_ID = "22222222-2222-4222-8222-222222222222";
const project: ProjectDto = {
  id: PROJECT_ID,
  customerId: CUSTOMER_ID,
  ownerMemberId: "member-1",
  title: "Project",
  status: ProjectStatus.Planned,
  phase: ProjectPhase.Onboarding,
  processSteps: [ProjectPhase.Onboarding],
  currentProcessStep: ProjectPhase.Onboarding,
  workflowKey: ProjectWorkflowKey.StandardWebV1,
  billingModel: ProjectBillingModel.FixedPrice,
  includedFeedbackRounds: 0,
  feedbackRoundPositions: [],
  previewUrl: null,
  nextStepLabel: null,
  nextStepDueOn: null,
  startedOn: null,
  budgetCents: null,
  hourlyRateCents: null,
  version: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function actor(permissions: Permission[]): WorkspaceActor {
  return {
    userId: "user-1",
    workspaceMemberId: "member-1",
    permissions: new Set(permissions),
    customerPermissions: new Map(),
    projectPermissions: new Map(),
  };
}

describe("buildProjectLineItemsViewModel", () => {
  beforeEach(() => {
    mocks.listProjectLineItemsByCustomer.mockReset().mockResolvedValue([]);
    mocks.listAssignableLineItemTemplates.mockReset().mockResolvedValue([]);
    mocks.listExtraFeedbackRoundBlockers
      .mockReset()
      .mockResolvedValue(new Map());
  });

  it("does not disclose catalog templates to a project-line-item writer without catalog read access", async () => {
    const result = await buildProjectLineItemsViewModel({
      actor: actor([
        Permission.ProjectLineItemsRead,
        Permission.ProjectLineItemsWrite,
      ]),
      catalogHref: null,
      customerId: CUSTOMER_ID,
      projects: [{ id: project.id, title: project.title, project }],
    });

    expect(mocks.listAssignableLineItemTemplates).not.toHaveBeenCalled();
    expect(result).toMatchObject({ assignableTemplates: [] });
  });

  it("loads active catalog templates for a catalog reader who may assign project line items", async () => {
    await buildProjectLineItemsViewModel({
      actor: actor([
        Permission.ProjectLineItemsRead,
        Permission.ProjectLineItemsWrite,
        Permission.LineItemTemplatesRead,
      ]),
      catalogHref: "/de/crm/line-item-templates",
      customerId: CUSTOMER_ID,
      projects: [{ id: project.id, title: project.title, project }],
    });

    expect(mocks.listAssignableLineItemTemplates).toHaveBeenCalledWith();
  });

  it("names what keeps hours and a further round from a project the actor may only assign to", async () => {
    const result = await buildProjectLineItemsViewModel({
      actor: actor([
        Permission.ProjectLineItemsRead,
        Permission.ProjectLineItemsWrite,
      ]),
      catalogHref: null,
      customerId: CUSTOMER_ID,
      projects: [{ id: project.id, title: project.title, project }],
    });

    expect(mocks.listExtraFeedbackRoundBlockers).toHaveBeenCalledWith([]);
    expect(result?.assignmentBlockersByProjectId).toEqual({
      [PROJECT_ID]: {
        hours: "missing_hours_permission",
        feedbackRound: "missing_project_permission",
      },
    });
  });

  it("clears both blockers for a member who may manage hours and write the project", async () => {
    mocks.listExtraFeedbackRoundBlockers.mockResolvedValue(
      new Map([[PROJECT_ID, null]]),
    );

    const result = await buildProjectLineItemsViewModel({
      actor: actor([
        Permission.ProjectLineItemsRead,
        Permission.ProjectLineItemsWrite,
        Permission.HoursManage,
        Permission.ProjectsWrite,
      ]),
      catalogHref: null,
      customerId: CUSTOMER_ID,
      projects: [{ id: project.id, title: project.title, project }],
    });

    expect(mocks.listExtraFeedbackRoundBlockers).toHaveBeenCalledWith([
      { id: PROJECT_ID, positions: [] },
    ]);
    expect(result?.assignmentBlockersByProjectId).toEqual({
      [PROJECT_ID]: { hours: null, feedbackRound: null },
    });
  });

  it("passes on an approved project and a closed one as blockers", async () => {
    mocks.listExtraFeedbackRoundBlockers.mockResolvedValue(
      new Map([[PROJECT_ID, "project_approved"]]),
    );

    const result = await buildProjectLineItemsViewModel({
      actor: actor([
        Permission.ProjectLineItemsRead,
        Permission.ProjectLineItemsWrite,
        Permission.HoursManage,
        Permission.ProjectsWrite,
      ]),
      catalogHref: null,
      customerId: CUSTOMER_ID,
      projects: [
        {
          id: project.id,
          title: project.title,
          project: { ...project, status: ProjectStatus.Archived },
        },
      ],
    });

    expect(result?.assignmentBlockersByProjectId).toEqual({
      [PROJECT_ID]: {
        hours: "project_closed",
        feedbackRound: "project_approved",
      },
    });
  });
});
