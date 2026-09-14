import { beforeEach, describe, expect, it, vi } from "vitest";

import { OwnableEntity } from "@invessiv/common/constants/crm/ownable-entities";
import type { AccessDatabaseExecutor } from "@/server/workspace/access/access-types";
import { responsibilityCounterService } from "@/server/workspace/access/services/responsibilities/responsibility-counter-registry";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  countOpen: vi.fn(),
}));

vi.mock(
  "@/server/workspace/access/services/responsibilities/customer-responsibility-counter",
  () => ({
    customerResponsibilityCounterService: { countOpen: mocks.countOpen },
  }),
);

describe("responsibilityCounterService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a complete count keyed by every ownable entity", async () => {
    const executor = {} as AccessDatabaseExecutor;
    mocks.countOpen.mockResolvedValue(2);

    await expect(
      responsibilityCounterService.countOpenByMemberId(
        executor,
        "00000000-0000-4000-8000-000000000001",
      ),
    ).resolves.toEqual({ [OwnableEntity.Customer]: 2 });

    expect(mocks.countOpen).toHaveBeenCalledWith(
      executor,
      "00000000-0000-4000-8000-000000000001",
    );
  });
});
