import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PortalMembershipOptionDto } from "@invessiv/common/contracts/portal/portal-membership-option.dto";
import { listPortalMembershipsForUserId } from "@/server/portal/query-handler/list-portal-memberships-for-user-id.query-handler";

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

const OPTION: PortalMembershipOptionDto = {
  customerId: "customer-1",
  displayName: "Nordlicht Coaching",
};

describe("listPortalMembershipsForUserId", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getDatabase.mockReturnValue(DATABASE);
  });

  it("returns the active companies of the given users.id", async () => {
    mocks.listActiveCustomersForUserId.mockResolvedValue([OPTION]);

    await expect(
      listPortalMembershipsForUserId("user-uuid-1"),
    ).resolves.toEqual([OPTION]);

    expect(mocks.listActiveCustomersForUserId).toHaveBeenCalledExactlyOnceWith(
      DATABASE,
      "user-uuid-1",
    );
  });
});
