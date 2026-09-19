import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AccessCustomerOptionDto } from "@invessiv/common/contracts/auth/access-customer-option.dto";
import type { AccessProjectOptionDto } from "@invessiv/common/contracts/auth/access-project-option.dto";
import { listAccessCustomerProjects } from "@/server/workspace/access/query-handler/list-access-customer-projects.query-handler";
import { listAccessCustomers } from "@/server/workspace/access/query-handler/list-access-customers.query-handler";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  searchCustomers: vi.fn(),
  listProjectsOfCustomer: vi.fn(),
}));

vi.mock("@invessiv/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@invessiv/db/core")>()),
  getDrizzleDatabaseClient: mocks.getDatabase,
}));
vi.mock(
  "@/server/workspace/access/services/access-lookup-read-service",
  () => ({
    accessLookupReadService: {
      searchCustomers: mocks.searchCustomers,
      listProjectsOfCustomer: mocks.listProjectsOfCustomer,
    },
  }),
);

const DATABASE = { marker: "pooled-client" };

const CUSTOMER: AccessCustomerOptionDto = {
  id: "customer-1",
  customerNumber: 7,
  displayName: "Nordlicht Coaching",
};

const PROJECT: AccessProjectOptionDto = {
  id: "project-1",
  customerId: "customer-1",
  title: "Website relaunch",
};

describe("access lookup query handlers", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getDatabase.mockReturnValue(DATABASE);
  });

  it("searches customers on the pooled client with nothing but the search text", async () => {
    mocks.searchCustomers.mockResolvedValue([CUSTOMER]);

    await expect(listAccessCustomers("Nord")).resolves.toEqual([CUSTOMER]);

    // The handler has no actor to hand over, so the read cannot be narrowed by the caller's scope.
    expect(mocks.searchCustomers).toHaveBeenCalledExactlyOnceWith(
      DATABASE,
      "Nord",
    );
  });

  it("lists the projects of one customer on the pooled client", async () => {
    mocks.listProjectsOfCustomer.mockResolvedValue([PROJECT]);

    await expect(listAccessCustomerProjects("customer-1")).resolves.toEqual([
      PROJECT,
    ]);

    expect(mocks.listProjectsOfCustomer).toHaveBeenCalledExactlyOnceWith(
      DATABASE,
      "customer-1",
    );
  });

  it("declares no actor parameter, so the lookups cannot be scope-filtered per caller", () => {
    expect(listAccessCustomers).toHaveLength(1);
    expect(listAccessCustomerProjects).toHaveLength(1);
  });
});
