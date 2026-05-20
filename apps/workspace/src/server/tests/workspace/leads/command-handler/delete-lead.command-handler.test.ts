import { describe, expect, it, vi } from "vitest";
import { LeadErrorCode } from "@invessiv/common/constants/leads/errors/lead-error-codes";

const { getDrizzleDatabaseClientMock } = vi.hoisted(() => ({
  getDrizzleDatabaseClientMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@invessiv/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@invessiv/db/core")>()),
  getDrizzleDatabaseClient: getDrizzleDatabaseClientMock,
}));

function setupDb(returningRows: ReadonlyArray<{ id: string }>) {
  let whereCalled = false;
  getDrizzleDatabaseClientMock.mockReturnValue({
    delete: vi.fn().mockImplementation(() => ({
      where: vi.fn().mockImplementation(() => {
        whereCalled = true;
        return {
          returning: vi.fn().mockResolvedValue(returningRows),
        };
      }),
    })),
  });
  return {
    wasWhereCalled: () => whereCalled,
  };
}

describe("deleteLead", () => {
  it("returns ok:true when a lead is deleted", async () => {
    vi.resetModules();
    const probe = setupDb([{ id: "lead-existing-uuid" }]);
    const { deleteLead } =
      await import("@/server/workspace/leads/command-handler/delete-lead.command-handler");

    const result = await deleteLead("lead-existing-uuid");

    expect(result).toEqual({ ok: true });
    expect(probe.wasWhereCalled()).toBe(true);
  });

  it("returns NOT_FOUND when no row was deleted", async () => {
    vi.resetModules();
    setupDb([]);
    const { deleteLead } =
      await import("@/server/workspace/leads/command-handler/delete-lead.command-handler");

    const result = await deleteLead("missing-uuid");

    expect(result).toEqual({ ok: false, code: LeadErrorCode.NotFound });
  });
});
