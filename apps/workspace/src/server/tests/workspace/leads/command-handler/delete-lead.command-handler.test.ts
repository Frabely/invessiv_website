import { beforeEach, describe, expect, it, vi } from "vitest";
import { LeadErrorCode } from "@invessiv/common/constants/leads/errors/lead-error-codes";
import { deleteLead } from "@/server/workspace/leads/command-handler/delete-lead.command-handler";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({ delete: vi.fn() }));
vi.mock("@/server/workspace/leads/services/lead/lead-service", () => ({
  leadService: { delete: mocks.delete },
}));

describe("deleteLead", () => {
  beforeEach(() => mocks.delete.mockReset());

  it("returns ok:true when a lead is deleted", async () => {
    mocks.delete.mockResolvedValue(["lead-existing-uuid"]);

    await expect(deleteLead("lead-existing-uuid")).resolves.toEqual({
      ok: true,
    });
    expect(mocks.delete).toHaveBeenCalledWith(["lead-existing-uuid"]);
  });

  it("returns NOT_FOUND when no row was deleted", async () => {
    mocks.delete.mockResolvedValue([]);

    await expect(deleteLead("missing-uuid")).resolves.toEqual({
      ok: false,
      code: LeadErrorCode.NotFound,
    });
  });
});
