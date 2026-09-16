import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCustomerById } from "@/server/workspace/crm/query-handler/get-customer-by-id.query-handler";
import { listCustomers } from "@/server/workspace/crm/query-handler/list-customers.query-handler";
import {
  customerDetailFixture,
  TEST_CUSTOMER_ID,
} from "@/server/tests/workspace/crm/support/crm-fixtures";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  database: { name: "database" },
  findDetail: vi.fn(),
  listSummaries: vi.fn(),
}));

vi.mock("@invessiv/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@invessiv/db/core")>()),
  getDrizzleDatabaseClient: () => mocks.database,
}));
vi.mock("@/server/workspace/crm/services/customer-read-service", () => ({
  customerReadService: {
    findDetailById: mocks.findDetail,
    listSummaries: mocks.listSummaries,
  },
}));

describe("customer query handlers", () => {
  beforeEach(() => {
    mocks.findDetail.mockReset();
    mocks.listSummaries.mockReset();
  });

  it("returns null for a malformed id without reading", async () => {
    await expect(getCustomerById("not-a-uuid")).resolves.toBeNull();
    expect(mocks.findDetail).not.toHaveBeenCalled();
  });

  it("returns the detail or null for an unknown id", async () => {
    mocks.findDetail.mockResolvedValueOnce(customerDetailFixture());
    await expect(getCustomerById(TEST_CUSTOMER_ID)).resolves.toEqual(
      customerDetailFixture(),
    );

    mocks.findDetail.mockResolvedValueOnce(null);
    await expect(getCustomerById(TEST_CUSTOMER_ID)).resolves.toBeNull();
    expect(mocks.findDetail).toHaveBeenCalledWith(
      mocks.database,
      TEST_CUSTOMER_ID,
    );
  });

  it("lists the overview with a fixed limit inside a result object", async () => {
    mocks.listSummaries.mockResolvedValue([]);

    await expect(listCustomers()).resolves.toEqual({ rows: [] });
    expect(mocks.listSummaries).toHaveBeenCalledWith(mocks.database, 100);
  });
});
