import { beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import { ProjectLineItemErrorCode } from "@invessiv/common/constants/crm/errors/project-line-item-error-codes";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { projectLineItems } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { createProjectLineItem } from "@/server/workspace/crm/command-handler/create-project-line-item.command-handler";
import { workspaceActorWith } from "@/server/tests/support/workspace-auth-fixtures";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  limit: vi.fn(),
  returning: vi.fn(),
  values: vi.fn(),
}));

vi.mock("@invessiv/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@invessiv/db/core")>()),
  getDrizzleDatabaseClient: mocks.getDatabase,
}));

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";
const PROJECT_ID = "33333333-3333-4333-8333-333333333333";
const OTHER_PROJECT_ID = "44444444-4444-4444-8444-444444444444";
const TEMPLATE_ID = "9c8f1a10-1b1a-4a10-8e10-00000000f001";

function createInput(overrides: Record<string, unknown> = {}) {
  return {
    sourceLineItemTemplateId: TEMPLATE_ID,
    title: "Landingpage",
    description: "Einseitige Website.",
    priceCents: 200000,
    pricingMode: ServicePricingMode.OneTime,
    recurringInterval: null,
    ...overrides,
  };
}

/** Two `select(...).from(...).where(...).limit(1)` calls: first the project, then the template. */
function stubSelects(results: unknown[][]) {
  mocks.limit.mockReset();
  for (const result of results) {
    mocks.limit.mockResolvedValueOnce(result);
  }
  mocks.limit.mockResolvedValue([]);
}

function actorWithCustomerBinding(
  customerId: string,
  permission: Permission,
): WorkspaceActor {
  return {
    ...workspaceActorWith([]),
    customerPermissions: new Map([[customerId, new Set([permission])]]),
  };
}

function actorWithProjectBinding(
  projectId: string,
  customerId: string,
  permission: Permission,
): WorkspaceActor {
  return {
    ...workspaceActorWith([]),
    projectPermissions: new Map([
      [projectId, { customerId, permissions: new Set([permission]) }],
    ]),
  };
}

describe("createProjectLineItem", () => {
  beforeEach(() => {
    mocks.getDatabase.mockReset();
    mocks.values.mockReset();
    mocks.returning.mockReset();
    mocks.values.mockReturnValue({ returning: mocks.returning });
    stubSelects([[{ customerId: CUSTOMER_ID }], [{ id: TEMPLATE_ID }]]);
    mocks.returning.mockResolvedValue([
      {
        id: "55555555-5555-4555-8555-555555555555",
        project_id: PROJECT_ID,
        source_line_item_template_id: TEMPLATE_ID,
        title: "Landingpage",
        description: "Einseitige Website.",
        price_cents: 200000,
        pricing_mode: ServicePricingMode.OneTime,
        recurring_interval: null,
        version: 1,
        created_at: new Date("2026-01-01T00:00:00.000Z"),
        updated_at: new Date("2026-01-01T00:00:00.000Z"),
      },
    ]);
    mocks.getDatabase.mockReturnValue({
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({ limit: mocks.limit })),
        })),
      })),
      insert: vi.fn(() => ({ values: mocks.values })),
    });
  });

  it("stores a snapshot at version 1 and keeps the template only as provenance", async () => {
    const result = await createProjectLineItem(
      PROJECT_ID,
      createInput(),
      workspaceActorWith([Permission.ProjectLineItemsWrite]),
    );

    expect(result).toEqual({
      ok: true,
      projectLineItem: expect.objectContaining({
        projectId: PROJECT_ID,
        sourceLineItemTemplateId: TEMPLATE_ID,
        priceCents: 200000,
        version: 1,
      }),
    });
    const inserted =
      mocks.getDatabase.mock.results[0]?.value.insert.mock.calls[0][0];
    expect(inserted).toBe(projectLineItems);
    expect(mocks.values).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: PROJECT_ID,
        source_line_item_template_id: TEMPLATE_ID,
        version: 1,
      }),
    );
  });

  it("stores the adjusted price instead of the template price", async () => {
    await createProjectLineItem(
      PROJECT_ID,
      createInput({ priceCents: 180000, title: "Landingpage (Paketpreis)" }),
      workspaceActorWith([Permission.ProjectLineItemsWrite]),
    );

    expect(mocks.values).toHaveBeenCalledWith(
      expect.objectContaining({
        price_cents: 180000,
        title: "Landingpage (Paketpreis)",
      }),
    );
  });

  it("passes a recurring interval through to the insert", async () => {
    await createProjectLineItem(
      PROJECT_ID,
      createInput({
        pricingMode: ServicePricingMode.Recurring,
        recurringInterval: BillingInterval.Monthly,
      }),
      workspaceActorWith([Permission.ProjectLineItemsWrite]),
    );

    expect(mocks.values).toHaveBeenCalledWith(
      expect.objectContaining({ recurring_interval: BillingInterval.Monthly }),
    );
  });

  it("answers not-found for a malformed project id without touching the database", async () => {
    const result = await createProjectLineItem(
      "not-a-uuid",
      createInput(),
      workspaceActorWith([Permission.ProjectLineItemsWrite]),
    );

    expect(result).toEqual({
      ok: false,
      code: ProjectLineItemErrorCode.ProjectNotFound,
    });
    expect(mocks.getDatabase).not.toHaveBeenCalled();
  });

  it("returns validation issues without touching the database", async () => {
    const result = await createProjectLineItem(
      PROJECT_ID,
      createInput({ title: " " }),
      workspaceActorWith([Permission.ProjectLineItemsWrite]),
    );

    expect(result).toMatchObject({
      ok: false,
      code: ProjectLineItemErrorCode.ValidationError,
      errors: [expect.objectContaining({ path: ["title"] })],
    });
    expect(mocks.getDatabase).not.toHaveBeenCalled();
  });

  it("answers not-found for a project that does not exist", async () => {
    stubSelects([[]]);

    const result = await createProjectLineItem(
      PROJECT_ID,
      createInput(),
      workspaceActorWith([Permission.ProjectLineItemsWrite]),
    );

    expect(result).toEqual({
      ok: false,
      code: ProjectLineItemErrorCode.ProjectNotFound,
    });
    expect(mocks.values).not.toHaveBeenCalled();
  });

  it("accepts a customer binding for any project of that customer", async () => {
    const result = await createProjectLineItem(
      PROJECT_ID,
      createInput(),
      actorWithCustomerBinding(CUSTOMER_ID, Permission.ProjectLineItemsWrite),
    );

    expect(result.ok).toBe(true);
  });

  it("refuses a customer binding for a project of another customer", async () => {
    const result = await createProjectLineItem(
      PROJECT_ID,
      createInput(),
      actorWithCustomerBinding(
        OTHER_CUSTOMER_ID,
        Permission.ProjectLineItemsWrite,
      ),
    );

    expect(result).toEqual({
      ok: false,
      code: ProjectLineItemErrorCode.ProjectNotFound,
    });
    expect(mocks.values).not.toHaveBeenCalled();
  });

  it("accepts a project binding for its own project", async () => {
    const result = await createProjectLineItem(
      PROJECT_ID,
      createInput(),
      actorWithProjectBinding(
        PROJECT_ID,
        CUSTOMER_ID,
        Permission.ProjectLineItemsWrite,
      ),
    );

    expect(result.ok).toBe(true);
  });

  it("refuses a project binding for a different project of the same customer", async () => {
    const result = await createProjectLineItem(
      PROJECT_ID,
      createInput(),
      actorWithProjectBinding(
        OTHER_PROJECT_ID,
        CUSTOMER_ID,
        Permission.ProjectLineItemsWrite,
      ),
    );

    expect(result).toEqual({
      ok: false,
      code: ProjectLineItemErrorCode.ProjectNotFound,
    });
    expect(mocks.values).not.toHaveBeenCalled();
  });

  it("refuses read access as a substitute for write access", async () => {
    const result = await createProjectLineItem(
      PROJECT_ID,
      createInput(),
      actorWithCustomerBinding(CUSTOMER_ID, Permission.ProjectLineItemsRead),
    );

    expect(result).toEqual({
      ok: false,
      code: ProjectLineItemErrorCode.ProjectNotFound,
    });
  });

  it("refuses an archived or unknown template", async () => {
    stubSelects([[{ customerId: CUSTOMER_ID }], []]);

    const result = await createProjectLineItem(
      PROJECT_ID,
      createInput(),
      workspaceActorWith([Permission.ProjectLineItemsWrite]),
    );

    expect(result).toEqual({
      ok: false,
      code: ProjectLineItemErrorCode.LineItemTemplateNotAssignable,
    });
    expect(mocks.values).not.toHaveBeenCalled();
  });
});
