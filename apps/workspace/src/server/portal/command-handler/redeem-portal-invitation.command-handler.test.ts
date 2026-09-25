import { beforeEach, describe, expect, it, vi } from "vitest";
import { PortalInvitationErrorCode } from "@invessiv/common/constants/portal/portal-invitation-error-codes";
import { redeemPortalInvitation } from "./redeem-portal-invitation.command-handler";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  securityEvent: vi.fn(),
}));
vi.mock("@invessiv/db/core", async (original) => ({
  ...(await original<typeof import("@invessiv/db/core")>()),
  getDrizzleDatabaseClient: mocks.getDatabase,
}));
vi.mock("@/server/workspace/auth/services/security-event-service", () => ({
  securityEventService: { createSecurityEvent: mocks.securityEvent },
}));

const clerkUser = {
  id: "clerk-user",
  primaryEmail: "contact@example.test",
  firstName: "Alex",
  lastName: "Contact",
  displayName: "Alex Contact",
};
const invitation = {
  id: "invitation-id",
  assignmentId: "assignment-id",
  emailNotificationsEnabled: true,
  createdByMemberId: "manager-id",
  expiresAt: new Date(Date.now() + 60_000),
  redeemedAt: null,
  revokedAt: null,
};

function selectRows(rows: unknown[]) {
  const query = {
    from: () => query,
    leftJoin: () => query,
    where: () => query,
    limit: () => query,
    for: async () => rows,
    then: (resolve: (value: unknown[]) => void) => resolve(rows),
  };
  return query;
}

function transactionWith(selectResults: unknown[][]) {
  let selectIndex = 0;
  const tx = {
    select: vi.fn(() => selectRows(selectResults[selectIndex++] ?? [])),
    insert: vi.fn(),
    update: vi.fn(),
  };
  mocks.getDatabase.mockReturnValue({
    transaction: (callback: (transaction: typeof tx) => Promise<unknown>) =>
      callback(tx),
  });
  return tx;
}

describe("redeemPortalInvitation", () => {
  beforeEach(() => {
    mocks.getDatabase.mockReset();
    mocks.securityEvent.mockReset();
  });

  it("does not create a membership for an expired invitation", async () => {
    const tx = transactionWith([
      [
        {
          ...invitation,
          expiresAt: new Date(Date.now() - 60_000),
        },
      ],
    ]);

    expect(await redeemPortalInvitation("expired-token", clerkUser)).toEqual({
      ok: false,
      code: PortalInvitationErrorCode.Expired,
    });
    expect(tx.insert).not.toHaveBeenCalled();
    expect(mocks.securityEvent).not.toHaveBeenCalled();
  });

  it("identifies an already redeemed invitation", async () => {
    const tx = transactionWith([
      [
        {
          ...invitation,
          redeemedAt: new Date(Date.now() - 60_000),
        },
      ],
    ]);

    expect(await redeemPortalInvitation("used-token", clerkUser)).toEqual({
      ok: false,
      code: PortalInvitationErrorCode.Redeemed,
    });
    expect(tx.insert).not.toHaveBeenCalled();
  });

  it("rejects an invitation whose role no longer grants portal access", async () => {
    const tx = transactionWith([
      [invitation],
      [{ customerId: "customer-id", personId: "person-id" }],
      [],
      [{ roleId: "role-id" }],
      [{ id: "role-id", permission: null }],
    ]);

    expect(
      await redeemPortalInvitation("inactive-role-token", clerkUser),
    ).toEqual({
      ok: false,
      code: PortalInvitationErrorCode.Invalid,
    });
    expect(tx.insert).not.toHaveBeenCalled();
    expect(tx.update).not.toHaveBeenCalled();
    expect(mocks.securityEvent).not.toHaveBeenCalled();
  });
});
