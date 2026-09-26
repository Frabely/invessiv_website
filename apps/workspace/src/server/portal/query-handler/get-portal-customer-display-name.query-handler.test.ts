import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { createPortalOwnerView } from "@/server/portal/auth/portal-owner-view";
import { getPortalCustomerDisplayName } from "./get-portal-customer-display-name.query-handler";

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

function readerWith(permissions: Permission[]) {
  return createPortalOwnerView({
    userId: "owner-user-uuid",
    customerId: CUSTOMER_ID,
    permissions: new Set(permissions),
  });
}

describe("getPortalCustomerDisplayName", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.where.mockReturnValue({ limit: mocks.limit });
    mocks.getDatabase.mockReturnValue({
      select: () => ({ from: () => ({ where: mocks.where }) }),
    });
  });

  it("returns the display name of the reader's customer", async () => {
    mocks.limit.mockResolvedValue([{ displayName: "Kanzlei Müller" }]);

    await expect(
      getPortalCustomerDisplayName(readerWith([Permission.PortalAccess])),
    ).resolves.toBe("Kanzlei Müller");

    const query = new PgDialect().sqlToQuery(
      mocks.where.mock.calls[0]![0] as SQL,
    );
    expect(query.params).toEqual([CUSTOMER_ID]);
  });

  it("filters with a deny-all condition without portal.access", async () => {
    mocks.limit.mockResolvedValue([]);

    await expect(getPortalCustomerDisplayName(readerWith([]))).resolves.toBe(
      null,
    );
    const query = new PgDialect().sqlToQuery(
      mocks.where.mock.calls[0]![0] as SQL,
    );
    expect(query.sql).toBe("FALSE");
  });
});
