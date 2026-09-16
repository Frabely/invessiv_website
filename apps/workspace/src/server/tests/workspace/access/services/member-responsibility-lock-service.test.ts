import { describe, expect, it, vi } from "vitest";

import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { memberResponsibilityLockService } from "@/server/workspace/access/services/responsibilities/member-responsibility-lock-service";

vi.mock("server-only", () => ({}));

function transactionReturning(rows: unknown[]) {
  const forLock = vi.fn().mockResolvedValue(rows);
  const tx = {
    select: vi.fn(() => ({
      from: () => ({ where: () => ({ for: forLock }) }),
    })),
  };
  return { forLock, tx: tx as unknown as ContactDatabaseTransaction };
}

describe("memberResponsibilityLockService", () => {
  it("locks the membership for update before a deactivation counts", async () => {
    const { forLock, tx } = transactionReturning([{ id: "member-1" }]);

    await memberResponsibilityLockService.lockMemberForDeactivation(
      tx,
      "member-1",
    );

    expect(forLock).toHaveBeenCalledWith("update");
  });

  it("holds a share lock and reports an active member", async () => {
    const { forLock, tx } = transactionReturning([{ active: true }]);

    await expect(
      memberResponsibilityLockService.lockActiveMemberForAssignment(
        tx,
        "member-1",
      ),
    ).resolves.toBe(true);
    expect(forLock).toHaveBeenCalledWith("share");
  });

  it("reports an inactive or missing member as not assignable", async () => {
    await expect(
      memberResponsibilityLockService.lockActiveMemberForAssignment(
        transactionReturning([{ active: false }]).tx,
        "member-1",
      ),
    ).resolves.toBeFalsy();
    await expect(
      memberResponsibilityLockService.lockActiveMemberForAssignment(
        transactionReturning([]).tx,
        "member-1",
      ),
    ).resolves.toBeFalsy();
  });
});
