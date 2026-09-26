import { describe, expect, it, vi } from "vitest";

import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { workspaceOwnerLookupService } from "@/server/shared/services/workspace-owner-lookup-service";

vi.mock("server-only", () => ({}));

function executorReturning(result: Promise<unknown>) {
  const limit = vi.fn(() => result);
  const where = vi.fn(() => ({ limit }));
  const chain = { innerJoin: vi.fn(), where };
  chain.innerJoin.mockReturnValue(chain);
  const executor = {
    select: vi.fn(() => ({ from: vi.fn(() => chain) })),
  } as unknown as Pick<ContactDatabaseTransaction, "select">;
  return { executor, where, limit };
}

describe("workspaceOwnerLookupService.findActiveOwnerUserId", () => {
  it("returns the users.id of an active owner", async () => {
    const { executor, limit } = executorReturning(
      Promise.resolve([{ userId: "user-uuid-1" }]),
    );

    await expect(
      workspaceOwnerLookupService.findActiveOwnerUserId(
        executor,
        "user_clerk_1",
      ),
    ).resolves.toBe("user-uuid-1");
    expect(limit).toHaveBeenCalledWith(1);
  });

  it("returns null when no active owner assignment matches", async () => {
    const { executor } = executorReturning(Promise.resolve([]));

    await expect(
      workspaceOwnerLookupService.findActiveOwnerUserId(
        executor,
        "user_clerk_1",
      ),
    ).resolves.toBeNull();
  });

  it("propagates database errors instead of answering 'not an owner'", async () => {
    const { executor } = executorReturning(
      Promise.reject(new Error("connection lost")),
    );

    await expect(
      workspaceOwnerLookupService.findActiveOwnerUserId(
        executor,
        "user_clerk_1",
      ),
    ).rejects.toThrow("connection lost");
  });
});
