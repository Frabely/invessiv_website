import { beforeEach, describe, expect, it, vi } from "vitest";

import { OwnableEntity } from "@invessiv/common/constants/crm/ownable-entities";
import type { AccessDatabaseExecutor } from "@/server/workspace/access/access-types";
import { responsibilityCounterService } from "@/server/workspace/access/services/responsibilities/responsibility-counter-registry";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  countOpenCustomers: vi.fn(),
  countOpenTasks: vi.fn(),
}));

vi.mock(
  "@/server/workspace/access/services/responsibilities/customer-responsibility-counter",
  () => ({
    customerResponsibilityCounterService: {
      countOpen: mocks.countOpenCustomers,
    },
  }),
);
vi.mock(
  "@/server/workspace/access/services/responsibilities/task-responsibility-counter",
  () => ({
    taskResponsibilityCounterService: { countOpen: mocks.countOpenTasks },
  }),
);
describe("responsibilityCounterService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a complete count keyed by every ownable entity", async () => {
    const where = vi.fn().mockResolvedValue([{ count: 4 }]);
    const from = vi.fn().mockReturnValue({ where });
    const select = vi.fn().mockReturnValue({ from });
    const executor = { select } as unknown as AccessDatabaseExecutor;
    mocks.countOpenCustomers.mockResolvedValue(2);
    mocks.countOpenTasks.mockResolvedValue(3);

    await expect(
      responsibilityCounterService.countOpenByMemberId(
        executor,
        "00000000-0000-4000-8000-000000000001",
      ),
    ).resolves.toEqual({
      [OwnableEntity.Customer]: 2,
      [OwnableEntity.Task]: 3,
      [OwnableEntity.Conversation]: 4,
    });

    expect(mocks.countOpenCustomers).toHaveBeenCalledWith(
      executor,
      "00000000-0000-4000-8000-000000000001",
    );
    expect(mocks.countOpenTasks).toHaveBeenCalledWith(
      executor,
      "00000000-0000-4000-8000-000000000001",
    );
    expect(select).toHaveBeenCalledOnce();
    expect(from).toHaveBeenCalledOnce();
    expect(where).toHaveBeenCalledOnce();
  });
});
