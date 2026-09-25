import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PortalMembershipOptionDto } from "@invessiv/common/contracts/portal/portal-membership-option.dto";
import { listPortalMembershipsForUser } from "@/server/portal/query-handler/list-portal-memberships-for-user.query-handler";

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

const OPTION: PortalMembershipOptionDto = {
  customerId: "customer-1",
  displayName: "Nordlicht Coaching",
};

describe("listPortalMembershipsForUser", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getDatabase.mockReturnValue(DATABASE);
  });

  it("returns the active companies of the given Clerk user", async () => {
    mocks.listActiveCustomersForUser.mockResolvedValue([OPTION]);

    await expect(listPortalMembershipsForUser("clerk-user-1")).resolves.toEqual(
      [OPTION],
    );

    expect(mocks.listActiveCustomersForUser).toHaveBeenCalledExactlyOnceWith(
      DATABASE,
      "clerk-user-1",
    );
  });
});
