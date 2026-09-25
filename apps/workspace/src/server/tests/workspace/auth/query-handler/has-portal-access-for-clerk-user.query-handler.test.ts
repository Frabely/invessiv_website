import { beforeEach, describe, expect, it, vi } from "vitest";

import { hasPortalAccessForClerkUser } from "@/server/workspace/auth/query-handler/has-portal-access-for-clerk-user.query-handler";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  listActiveCustomersForUser: vi.fn(),
}));

vi.mock("@invessiv/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@invessiv/db/core")>()),
  getDrizzleDatabaseClient: mocks.getDatabase,
}));
vi.mock("@/server/portal/services/portal-membership-lookup-service", () => ({
  portalMembershipLookupService: {
    listActiveCustomersForUser: mocks.listActiveCustomersForUser,
  },
}));

const DATABASE = { marker: "pooled-client" };

describe("hasPortalAccessForClerkUser", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getDatabase.mockReturnValue(DATABASE);
  });

  it("returns true when the lookup finds at least one active membership", async () => {
    mocks.listActiveCustomersForUser.mockResolvedValue([
      { customerId: "customer-1", displayName: "Nordlicht Coaching" },
    ]);

    await expect(hasPortalAccessForClerkUser("clerk-user-1")).resolves.toBe(
      true,
    );

    expect(mocks.listActiveCustomersForUser).toHaveBeenCalledExactlyOnceWith(
      DATABASE,
      "clerk-user-1",
    );
  });

  it("returns false when the lookup finds no active membership", async () => {
    mocks.listActiveCustomersForUser.mockResolvedValue([]);

    await expect(hasPortalAccessForClerkUser("clerk-user-1")).resolves.toBe(
      false,
    );
  });

  it("fails closed instead of throwing when the lookup errors", async () => {
    mocks.listActiveCustomersForUser.mockRejectedValue(
      new Error("connection reset"),
    );

    await expect(hasPortalAccessForClerkUser("clerk-user-1")).resolves.toBe(
      false,
    );
  });
});
