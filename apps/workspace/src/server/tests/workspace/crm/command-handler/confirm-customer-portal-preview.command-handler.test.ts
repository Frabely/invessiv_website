import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { PortalAccessErrorCode } from "@invessiv/common/constants/crm/errors/portal-access-error-codes";
import { confirmCustomerPortalPreview } from "@/server/workspace/crm/command-handler/confirm-customer-portal-preview.command-handler";
import { workspaceActorWith } from "@/server/tests/support/workspace-auth-fixtures";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  updateVersioned: vi.fn(),
}));
vi.mock("@invessiv/db/core", async (original) => ({
  ...(await original<typeof import("@invessiv/db/core")>()),
  getDrizzleDatabaseClient: mocks.getDatabase,
}));
vi.mock("@/server/workspace/shared/update-versioned", () => ({
  updateVersioned: mocks.updateVersioned,
}));

const customerId = "b63c69de-2ab3-4cb8-861f-d157d95aec79";

describe("confirmCustomerPortalPreview", () => {
  beforeEach(() => {
    mocks.getDatabase.mockReset();
    mocks.updateVersioned.mockReset();
    mocks.getDatabase.mockReturnValue({
      transaction: (callback: (tx: unknown) => Promise<unknown>) =>
        callback({}),
    });
  });

  it("forwards the current state on a version conflict, like every other versioned write", async () => {
    mocks.updateVersioned.mockResolvedValue({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict: {
        code: ConcurrencyErrorCode.VersionConflict,
        currentVersion: 4,
        current: { version: 4 },
      },
    });

    const result = await confirmCustomerPortalPreview(
      customerId,
      { version: 2 },
      workspaceActorWith(),
    );

    expect(result).toEqual({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict: {
        code: ConcurrencyErrorCode.VersionConflict,
        currentVersion: 4,
        current: { version: 4 },
      },
    });
  });

  it("records the confirmation on success", async () => {
    mocks.updateVersioned.mockResolvedValue({
      ok: true,
      value: { version: 3 },
    });

    const result = await confirmCustomerPortalPreview(
      customerId,
      { version: 2 },
      workspaceActorWith(),
    );

    expect(result).toEqual({ ok: true, version: 3 });
  });

  it("maps a vanished row to not_found instead of a conflict", async () => {
    mocks.updateVersioned.mockResolvedValue({
      ok: false,
      code: ConcurrencyErrorCode.NotFound,
    });

    const result = await confirmCustomerPortalPreview(
      customerId,
      { version: 2 },
      workspaceActorWith(),
    );

    expect(result).toEqual({
      ok: false,
      code: PortalAccessErrorCode.NotFound,
    });
  });
});
