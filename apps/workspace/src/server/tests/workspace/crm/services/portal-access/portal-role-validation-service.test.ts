import { describe, expect, it, vi } from "vitest";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { portalRoleValidationService } from "@/server/workspace/crm/services/portal-access/portal-role-validation-service";

vi.mock("server-only", () => ({}));

function transactionWithAvailableRoles(
  availableIds: string[],
): ContactDatabaseTransaction {
  const query = {
    from: () => query,
    leftJoin: () => query,
    where: async () =>
      availableIds.map((id) => ({ id, permission: "portal.access" })),
  };
  return { select: () => query } as unknown as ContactDatabaseTransaction;
}

describe("portalRoleValidationService", () => {
  it("accepts a complete set of active portal roles", async () => {
    const tx = transactionWithAvailableRoles(["role-a", "role-b"]);
    expect(
      await portalRoleValidationService.areActivePortalRoles(tx, [
        "role-a",
        "role-b",
      ]),
    ).toBe(true);
  });

  it("rejects a set when a selected role is unavailable", async () => {
    const tx = transactionWithAvailableRoles(["role-a"]);
    expect(
      await portalRoleValidationService.areActivePortalRoles(tx, [
        "role-a",
        "role-b",
      ]),
    ).toBe(false);
  });

  it("rejects active roles that do not grant portal access", async () => {
    const query = {
      from: () => query,
      leftJoin: () => query,
      where: async () => [{ id: "role-a", permission: null }],
    };
    const tx = { select: () => query } as unknown as ContactDatabaseTransaction;
    expect(
      await portalRoleValidationService.areActivePortalRoles(tx, ["role-a"]),
    ).toBe(false);
  });
});
