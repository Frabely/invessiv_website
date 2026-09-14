import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";

import { CUSTOMER_ACTIVE_STATUS_VALUES } from "@invessiv/common/constants/crm/customer-statuses";
import type { AccessDatabaseExecutor } from "@/server/workspace/access/access-types";
import { countOpenCustomerResponsibilities } from "@/server/workspace/access/services/responsibilities/customer-responsibility-counter";

vi.mock("server-only", () => ({}));

function createExecutor(rows: { count: number }[]) {
  const where = vi.fn((condition?: unknown) => {
    void condition;
    return Promise.resolve(rows);
  });
  const from = vi.fn(() => ({ where }));
  const select = vi.fn((selection?: unknown) => {
    void selection;
    return { from };
  });

  return {
    executor: { select } as unknown as AccessDatabaseExecutor,
    from,
    select,
    where,
  };
}

describe("countOpenCustomerResponsibilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the aggregate count without loading customer fields", async () => {
    const { executor, from, select, where } = createExecutor([{ count: 3 }]);
    const memberId = "00000000-0000-4000-8000-000000000001";

    await expect(
      countOpenCustomerResponsibilities(executor, memberId),
    ).resolves.toBe(3);

    expect(select).toHaveBeenCalledOnce();
    expect(select.mock.calls[0]?.[0]).toEqual({ count: expect.anything() });
    expect(from).toHaveBeenCalledOnce();
    expect(where).toHaveBeenCalledOnce();

    const condition = where.mock.calls[0]?.[0] as SQL | undefined;
    expect(condition).toBeDefined();
    expect(new PgDialect().sqlToQuery(condition as SQL).params).toEqual([
      memberId,
      ...CUSTOMER_ACTIVE_STATUS_VALUES,
    ]);
  });

  it("returns zero when the aggregate query has no row", async () => {
    const { executor } = createExecutor([]);

    await expect(
      countOpenCustomerResponsibilities(
        executor,
        "00000000-0000-4000-8000-000000000001",
      ),
    ).resolves.toBe(0);
  });
});
