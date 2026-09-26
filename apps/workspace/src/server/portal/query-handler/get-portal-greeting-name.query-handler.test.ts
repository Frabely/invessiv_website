import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { createPortalActor } from "@/server/portal/auth/portal-actor";
import { createPortalOwnerView } from "@/server/portal/auth/portal-owner-view";
import { getPortalGreetingName } from "./get-portal-greeting-name.query-handler";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
}));

vi.mock("@invessiv/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@invessiv/db/core")>()),
  getDrizzleDatabaseClient: mocks.getDatabase,
}));

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";

function actorWith(permissions: Permission[]) {
  return createPortalActor({
    userId: "user-uuid-1",
    membershipId: "membership-uuid-1",
    customerId: CUSTOMER_ID,
    personId: "person-uuid-1",
    permissions: new Set(permissions),
    projectPermissions: new Map(),
  });
}

describe("getPortalGreetingName", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.where.mockReturnValue({ limit: mocks.limit });
    mocks.getDatabase.mockReturnValue({
      select: () => ({
        from: () => ({ innerJoin: () => ({ where: mocks.where }) }),
      }),
    });
  });

  it("returns the contact's trimmed first name within the reader's customer", async () => {
    mocks.limit.mockResolvedValue([{ firstName: " Sam " }]);

    await expect(
      getPortalGreetingName(actorWith([Permission.PortalAccess])),
    ).resolves.toBe("Sam");
    const query = new PgDialect().sqlToQuery(
      mocks.where.mock.calls[0]![0] as SQL,
    );
    expect(query.params).toEqual([CUSTOMER_ID]);
  });

  it("returns null for a missing or blank first name", async () => {
    mocks.limit.mockResolvedValueOnce([{ firstName: null }]);
    mocks.limit.mockResolvedValueOnce([{ firstName: "  " }]);

    const actor = actorWith([Permission.PortalAccess]);
    await expect(getPortalGreetingName(actor)).resolves.toBeNull();
    await expect(getPortalGreetingName(actor)).resolves.toBeNull();
  });

  it("greets nobody in the owner view and does not query", async () => {
    await expect(
      getPortalGreetingName(
        createPortalOwnerView({
          userId: "owner-user-uuid",
          customerId: CUSTOMER_ID,
          permissions: new Set([Permission.PortalAccess]),
        }),
      ),
    ).resolves.toBeNull();
    expect(mocks.getDatabase).not.toHaveBeenCalled();
  });
});
