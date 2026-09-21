import { beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ProjectLineItemErrorCode } from "@invessiv/common/constants/crm/errors/project-line-item-error-codes";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { updateProjectLineItem } from "@/server/workspace/crm/command-handler/update-project-line-item.command-handler";
import { workspaceActorWith } from "@/server/tests/support/workspace-auth-fixtures";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  limit: vi.fn(),
  updateVersioned: vi.fn(),
}));

vi.mock("@invessiv/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@invessiv/db/core")>()),
  getDrizzleDatabaseClient: mocks.getDatabase,
}));
vi.mock("@/server/workspace/shared/update-versioned", () => ({
  updateVersioned: mocks.updateVersioned,
}));

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";
const PROJECT_ID = "33333333-3333-4333-8333-333333333333";
const OTHER_PROJECT_ID = "44444444-4444-4444-8444-444444444444";
const PROJECT_LINE_ITEM_ID = "55555555-5555-4555-8555-555555555555";

function updateInput(overrides: Record<string, unknown> = {}) {
  return {
    title: "Landingpage",
    description: "",
    priceCents: 180000,
    pricingMode: ServicePricingMode.OneTime,
    recurringInterval: null,
    version: 3,
    ...overrides,
  };
}

function actorWithCustomerBinding(customerId: string): WorkspaceActor {
  return {
    ...workspaceActorWith([]),
    customerPermissions: new Map([
      [customerId, new Set([Permission.ProjectLineItemsWrite])],
    ]),
  };
}

function actorWithProjectBinding(projectId: string): WorkspaceActor {
  return {
    ...workspaceActorWith([]),
    projectPermissions: new Map([
      [
        projectId,
        {
          customerId: CUSTOMER_ID,
          permissions: new Set([Permission.ProjectLineItemsWrite]),
        },
      ],
    ]),
  };
}

describe("updateProjectLineItem", () => {
  beforeEach(() => {
    mocks.getDatabase.mockReset();
    mocks.limit.mockReset();
    mocks.updateVersioned.mockReset();
    mocks.limit.mockResolvedValue([
      { customerId: CUSTOMER_ID, projectId: PROJECT_ID },
    ]);
    mocks.updateVersioned.mockResolvedValue({
      ok: true,
      value: { id: PROJECT_LINE_ITEM_ID, version: 4 },
    });
    mocks.getDatabase.mockReturnValue({
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            where: vi.fn(() => ({ limit: mocks.limit })),
          })),
        })),
      })),
      transaction: (callback: (tx: unknown) => unknown) => callback({}),
    });
  });

  it("writes the snapshot through the versioned helper", async () => {
    const result = await updateProjectLineItem(
      PROJECT_LINE_ITEM_ID,
      updateInput(),
      workspaceActorWith([Permission.ProjectLineItemsWrite]),
    );

    expect(result).toEqual({
      ok: true,
      projectLineItem: { id: PROJECT_LINE_ITEM_ID, version: 4 },
    });
    expect(mocks.updateVersioned).toHaveBeenCalledWith(
      expect.objectContaining({
        id: PROJECT_LINE_ITEM_ID,
        expectedVersion: 3,
        patch: expect.objectContaining({ price_cents: 180000 }),
      }),
    );
  });

  it("never writes the origin template, so provenance stays immutable", async () => {
    await updateProjectLineItem(
      PROJECT_LINE_ITEM_ID,
      updateInput(),
      workspaceActorWith([Permission.ProjectLineItemsWrite]),
    );

    const { patch } = mocks.updateVersioned.mock.calls[0][0] as {
      patch: Record<string, unknown>;
    };
    expect(patch).not.toHaveProperty("source_line_item_template_id");
    expect(patch).not.toHaveProperty("project_id");
  });

  it("returns not-found instead of a validation error for a malformed id", async () => {
    const result = await updateProjectLineItem(
      "not-a-uuid",
      updateInput(),
      workspaceActorWith([Permission.ProjectLineItemsWrite]),
    );

    expect(result).toEqual({
      ok: false,
      code: ProjectLineItemErrorCode.ProjectLineItemNotFound,
    });
    expect(mocks.updateVersioned).not.toHaveBeenCalled();
  });

  it("returns validation issues without writing", async () => {
    const result = await updateProjectLineItem(
      PROJECT_LINE_ITEM_ID,
      updateInput({ title: " " }),
      workspaceActorWith([Permission.ProjectLineItemsWrite]),
    );

    expect(result).toMatchObject({
      ok: false,
      code: ProjectLineItemErrorCode.ValidationError,
    });
    expect(mocks.updateVersioned).not.toHaveBeenCalled();
  });

  it("answers not-found for a service that does not exist", async () => {
    mocks.limit.mockResolvedValue([]);

    const result = await updateProjectLineItem(
      PROJECT_LINE_ITEM_ID,
      updateInput(),
      workspaceActorWith([Permission.ProjectLineItemsWrite]),
    );

    expect(result).toEqual({
      ok: false,
      code: ProjectLineItemErrorCode.ProjectLineItemNotFound,
    });
    expect(mocks.updateVersioned).not.toHaveBeenCalled();
  });

  it("accepts a customer binding covering the owning project", async () => {
    const result = await updateProjectLineItem(
      PROJECT_LINE_ITEM_ID,
      updateInput(),
      actorWithCustomerBinding(CUSTOMER_ID),
    );

    expect(result.ok).toBe(true);
  });

  it("refuses a customer binding for another customer", async () => {
    const result = await updateProjectLineItem(
      PROJECT_LINE_ITEM_ID,
      updateInput(),
      actorWithCustomerBinding(OTHER_CUSTOMER_ID),
    );

    expect(result).toEqual({
      ok: false,
      code: ProjectLineItemErrorCode.ProjectLineItemNotFound,
    });
    expect(mocks.updateVersioned).not.toHaveBeenCalled();
  });

  it("refuses a project binding for another project", async () => {
    const result = await updateProjectLineItem(
      PROJECT_LINE_ITEM_ID,
      updateInput(),
      actorWithProjectBinding(OTHER_PROJECT_ID),
    );

    expect(result).toEqual({
      ok: false,
      code: ProjectLineItemErrorCode.ProjectLineItemNotFound,
    });
    expect(mocks.updateVersioned).not.toHaveBeenCalled();
  });

  it("maps a deleted row to not-found, not to a version conflict", async () => {
    mocks.updateVersioned.mockResolvedValue({
      ok: false,
      code: ConcurrencyErrorCode.NotFound,
    });

    const result = await updateProjectLineItem(
      PROJECT_LINE_ITEM_ID,
      updateInput(),
      workspaceActorWith([Permission.ProjectLineItemsWrite]),
    );

    expect(result).toEqual({
      ok: false,
      code: ProjectLineItemErrorCode.ProjectLineItemNotFound,
    });
  });

  it("passes a version conflict through with the current state", async () => {
    const conflict = {
      code: ConcurrencyErrorCode.VersionConflict,
      currentVersion: 7,
      current: { id: PROJECT_LINE_ITEM_ID, version: 7 },
    };
    mocks.updateVersioned.mockResolvedValue({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict,
    });

    const result = await updateProjectLineItem(
      PROJECT_LINE_ITEM_ID,
      updateInput(),
      workspaceActorWith([Permission.ProjectLineItemsWrite]),
    );

    expect(result).toEqual({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict,
    });
  });
});
