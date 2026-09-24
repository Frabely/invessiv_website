import { beforeEach, describe, expect, it, vi } from "vitest";

import { hasPortalAccessForUserId } from "@/server/workspace/auth/query-handler/has-portal-access-for-user-id.query-handler";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  listActiveCustomersForUserId: vi.fn(),
}));

vi.mock("@invessiv/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@invessiv/db/core")>()),
  getDrizzleDatabaseClient: mocks.getDatabase,
}));
vi.mock("@/server/portal/services/portal-membership-lookup-service", () => ({
  portalMembershipLookupService: {
    listActiveCustomersForUserId: mocks.listActiveCustomersForUserId,
  },
}));

const DATABASE = { marker: "pooled-client" };

describe("hasPortalAccessForUserId", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getDatabase.mockReturnValue(DATABASE);
  });

  it("returns true when the lookup finds at least one active membership", async () => {
    mocks.listActiveCustomersForUserId.mockResolvedValue([
      { customerId: "customer-1", displayName: "Nordlicht Coaching" },
    ]);

    await expect(hasPortalAccessForUserId("user-uuid-1")).resolves.toBe(true);

    expect(mocks.listActiveCustomersForUserId).toHaveBeenCalledExactlyOnceWith(
      DATABASE,
      "user-uuid-1",
    );
  });

  it("returns false when the lookup finds no active membership", async () => {
    mocks.listActiveCustomersForUserId.mockResolvedValue([]);

    await expect(hasPortalAccessForUserId("user-uuid-1")).resolves.toBe(false);
  });

  it("fails closed instead of throwing when the lookup errors", async () => {
    mocks.listActiveCustomersForUserId.mockRejectedValue(
      new Error("connection reset"),
    );

    await expect(hasPortalAccessForUserId("user-uuid-1")).resolves.toBe(false);
  });
});
