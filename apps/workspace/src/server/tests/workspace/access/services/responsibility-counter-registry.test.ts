import { beforeEach, describe, expect, it, vi } from "vitest";

import { OwnableEntity } from "@invessiv/common/constants/crm/ownable-entities";
import type { AccessDatabaseExecutor } from "@/server/workspace/access/access-types";
import { responsibilityCounterService } from "@/server/workspace/access/services/responsibilities/responsibility-counter-registry";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  countOpenCustomers: vi.fn(),
  countOpenTasks: vi.fn(),
  countOpenConversations: vi.fn(),
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
vi.mock(
  "@/server/workspace/access/services/responsibilities/conversation-responsibility-counter",
  () => ({
    conversationResponsibilityCounterService: {
      countOpen: mocks.countOpenConversations,
    },
  }),
);

describe("responsibilityCounterService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a complete count keyed by every ownable entity", async () => {
    const executor = {} as AccessDatabaseExecutor;
    const memberId = "00000000-0000-4000-8000-000000000001";
    mocks.countOpenCustomers.mockResolvedValue(2);
    mocks.countOpenTasks.mockResolvedValue(3);
    mocks.countOpenConversations.mockResolvedValue(4);

    await expect(
      responsibilityCounterService.countOpenByMemberId(executor, memberId),
    ).resolves.toEqual({
      [OwnableEntity.Customer]: 2,
      [OwnableEntity.Task]: 3,
      [OwnableEntity.Conversation]: 4,
    });

    for (const counter of [
      mocks.countOpenCustomers,
      mocks.countOpenTasks,
      mocks.countOpenConversations,
    ])
      expect(counter).toHaveBeenCalledWith(executor, memberId);
  });
});
