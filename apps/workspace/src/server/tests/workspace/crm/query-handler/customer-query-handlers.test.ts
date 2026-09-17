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
  countSummaries: vi.fn(),
  listSummaries: vi.fn(),
}));

vi.mock("@invessiv/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@invessiv/db/core")>()),
  getDrizzleDatabaseClient: () => mocks.database,
}));
vi.mock("@/server/workspace/crm/services/customer-read-service", () => ({
  customerReadService: {
    findDetailById: mocks.findDetail,
    countSummaries: mocks.countSummaries,
    listSummaries: mocks.listSummaries,
  },
}));

describe("customer query handlers", () => {
  beforeEach(() => {
    mocks.findDetail.mockReset();
    mocks.countSummaries.mockReset();
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
      false,
    );
  });

  it("lists a clamped page with count metadata", async () => {
    mocks.countSummaries.mockResolvedValueOnce(26);
    mocks.listSummaries.mockResolvedValue([]);

    await expect(
      listCustomers({
        includeArchived: false,
        page: 9,
        sort: "updated_desc",
      }),
    ).resolves.toEqual({
      hasCustomers: true,
      page: 2,
      perPage: 25,
      rows: [],
      total: 26,
    });
    expect(mocks.listSummaries).toHaveBeenCalledWith(
      mocks.database,
      { includeArchived: false, page: 2, sort: "updated_desc" },
      25,
    );
  });

  it("distinguishes archived customers from an entirely empty workspace", async () => {
    mocks.countSummaries.mockResolvedValueOnce(0).mockResolvedValueOnce(4);
    mocks.listSummaries.mockResolvedValue([]);

    await expect(
      listCustomers({
        includeArchived: false,
        page: 1,
        sort: "updated_desc",
      }),
    ).resolves.toMatchObject({ hasCustomers: true, rows: [], total: 0 });
    expect(mocks.countSummaries).toHaveBeenNthCalledWith(
      2,
      mocks.database,
      true,
    );
  });
});
