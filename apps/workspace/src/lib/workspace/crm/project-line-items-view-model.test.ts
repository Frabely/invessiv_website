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
  listLineItemTemplates: vi.fn(),
}));

vi.mock(
  "@/server/workspace/crm/query-handler/list-project-line-items-by-customer.query-handler",
  () => ({
    listProjectLineItemsByCustomer: mocks.listProjectLineItemsByCustomer,
  }),
);
vi.mock(
  "@/server/workspace/crm/query-handler/list-line-item-templates.query-handler",
  () => ({ listLineItemTemplates: mocks.listLineItemTemplates }),
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
  includedFeedbackRounds: 2,
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
    mocks.listLineItemTemplates.mockReset().mockResolvedValue({
      hasLineItemTemplates: true,
      rows: [],
    });
  });

  it("does not disclose catalog templates to a project-line-item writer without catalog read access", async () => {
    const result = await buildProjectLineItemsViewModel({
      actor: actor([
        Permission.ProjectLineItemsRead,
        Permission.ProjectLineItemsWrite,
      ]),
      catalogHref: null,
      customerId: CUSTOMER_ID,
      projects: [project],
    });

    expect(mocks.listLineItemTemplates).not.toHaveBeenCalled();
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
      projects: [project],
    });

    expect(mocks.listLineItemTemplates).toHaveBeenCalledWith({
      includeArchived: false,
    });
  });
});
