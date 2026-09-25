import { beforeEach, describe, expect, it, vi } from "vitest";
import { sql } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { updatePortalMembershipNotifications } from "@/server/workspace/crm/command-handler/update-portal-membership-notifications.command-handler";
import { replacePortalMembershipRoles } from "@/server/workspace/crm/command-handler/replace-portal-membership-roles.command-handler";
import { revokePortalMembership } from "@/server/workspace/crm/command-handler/revoke-portal-membership.command-handler";
import { workspaceActorWith } from "@/server/tests/support/workspace-auth-fixtures";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  updateVersioned: vi.fn(),
  securityEvent: vi.fn(),
}));
vi.mock("@invessiv/db/core", async (original) => ({
  ...(await original<typeof import("@invessiv/db/core")>()),
  getDrizzleDatabaseClient: mocks.getDatabase,
}));
vi.mock("@/server/workspace/shared/update-versioned", () => ({
  updateVersioned: mocks.updateVersioned,
}));
vi.mock("@/server/shared/services/security-event-service", () => ({
  securityEventService: { createSecurityEvent: mocks.securityEvent },
}));

const membershipId = "b63c69de-2ab3-4cb8-861f-d157d95aec79";

function customerPortalManager() {
  return {
    ...workspaceActorWith([Permission.CustomersRead]),
    customerPermissions: new Map([
      ["customer-a", new Set([Permission.PortalAccessManage])],
    ]),
  };
}

function membershipQueryFor(membership: object) {
  const query = {
    from: () => query,
    where: () => query,
    limit: () => query,
    for: async () => [membership],
  };
  return query;
}

describe("updatePortalMembershipNotifications", () => {
  beforeEach(() => {
    mocks.getDatabase.mockReset();
    mocks.updateVersioned.mockReset();
    mocks.securityEvent.mockReset();
  });

  it("rejects an empty role set before opening a transaction", async () => {
    const result = await updatePortalMembershipNotifications(
      membershipId,
      { version: 0, emailNotificationsEnabled: true },
      workspaceActorWith(),
    );
    expect(result).toEqual({ ok: false, code: "validation_error" });
    expect(mocks.getDatabase).not.toHaveBeenCalled();
  });

  it("rejects malformed request bodies before opening a transaction", async () => {
    const result = await updatePortalMembershipNotifications(
      membershipId,
      "invalid" as never,
      workspaceActorWith(),
    );
    expect(result).toEqual({ ok: false, code: "validation_error" });
    expect(mocks.getDatabase).not.toHaveBeenCalled();
  });

  it("does not update a membership of another customer", async () => {
    const membership = {
      id: membershipId,
      customer_id: "customer-b",
      version: 1,
      revoked_at: null,
    };
    const query = membershipQueryFor(membership);
    mocks.getDatabase.mockReturnValue({
      transaction: (
        callback: (tx: { select: () => typeof query }) => Promise<unknown>,
      ) => callback({ select: () => query }),
    });
    const result = await updatePortalMembershipNotifications(
      membershipId,
      {
        version: 1,
        emailNotificationsEnabled: false,
      },
      customerPortalManager(),
    );
    expect(result).toEqual({ ok: false, code: "not_found" });
    expect(mocks.updateVersioned).not.toHaveBeenCalled();
  });

  it("uses the versioned writer for a notification preference change", async () => {
    const membership = {
      id: membershipId,
      customer_id: "customer-a",
      version: 2,
      revoked_at: null,
    };
    const query = membershipQueryFor(membership);
    mocks.getDatabase.mockReturnValue({
      transaction: (
        callback: (tx: { select: () => typeof query }) => Promise<unknown>,
      ) => callback({ select: () => query }),
    });
    mocks.updateVersioned.mockResolvedValue({
      ok: true,
      value: { id: membershipId, version: 3, emailNotificationsEnabled: false },
    });
    const result = await updatePortalMembershipNotifications(
      membershipId,
      {
        version: 2,
        emailNotificationsEnabled: false,
      },
      customerPortalManager(),
    );

    expect(result).toEqual({
      ok: true,
      membership: {
        id: membershipId,
        version: 3,
        emailNotificationsEnabled: false,
      },
    });
    expect(mocks.updateVersioned).toHaveBeenCalledWith(
      expect.objectContaining({
        id: membershipId,
        expectedVersion: 2,
        patch: { email_notifications_enabled: false },
      }),
    );
  });

  it("replaces roles and records a security event after the versioned write", async () => {
    const roleId = "13c64fe8-cea3-48ad-b99c-3774b878b31f";
    const membership = {
      id: membershipId,
      customer_id: "customer-a",
      version: 2,
      revoked_at: null,
    };
    const membershipQuery = membershipQueryFor(membership);
    const roleQuery = {
      from: () => roleQuery,
      leftJoin: () => roleQuery,
      where: async () => [{ id: roleId, permission: "portal.access" }],
    };
    const membershipRoleQuery = {
      from: () => membershipRoleQuery,
      where: async () => [{ roleId: "58d4a66f-22a4-49a8-a3d4-e9fb80a3102d" }],
    };
    const deleteQuery = { where: vi.fn().mockResolvedValue(undefined) };
    const insertQuery = { values: vi.fn().mockResolvedValue(undefined) };
    const tx = {
      select: vi.fn((columns?: { roleId?: unknown; permission?: unknown }) =>
        columns?.roleId
          ? membershipRoleQuery
          : columns?.permission
            ? roleQuery
            : membershipQuery,
      ),
      delete: vi.fn(() => deleteQuery),
      insert: vi.fn(() => insertQuery),
    };
    mocks.getDatabase.mockReturnValue({
      transaction: (callback: (transaction: typeof tx) => Promise<unknown>) =>
        callback(tx),
    });
    mocks.updateVersioned.mockResolvedValue({
      ok: true,
      value: { id: membershipId, version: 3, emailNotificationsEnabled: true },
    });
    const result = await replacePortalMembershipRoles(
      membershipId,
      { version: 2, roleIds: [roleId] },
      customerPortalManager(),
    );

    expect(result.ok).toBe(true);
    expect(mocks.updateVersioned).toHaveBeenCalledWith(
      expect.objectContaining({ patch: {} }),
    );
    expect(deleteQuery.where).toHaveBeenCalledOnce();
    expect(insertQuery.values).toHaveBeenCalledWith([
      expect.objectContaining({ role_id: roleId }),
    ]);
    expect(mocks.securityEvent).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        subjectId: membershipId,
        metadata: { customerId: "customer-a", roleIds: [roleId] },
      }),
    );
  });
});

describe("revokePortalMembership", () => {
  beforeEach(() => {
    mocks.getDatabase.mockReset();
    mocks.updateVersioned.mockReset();
    mocks.securityEvent.mockReset();
  });

  it("rejects malformed ids without opening a transaction", async () => {
    expect(await revokePortalMembership("invalid", workspaceActorWith())).toBe(
      false,
    );
    expect(mocks.getDatabase).not.toHaveBeenCalled();
  });

  it("does not revoke a membership of another customer", async () => {
    const membership = {
      id: membershipId,
      customer_id: "customer-b",
      revoked_at: null,
    };
    const query = membershipQueryFor(membership);
    const tx = { select: () => query, update: vi.fn() };
    mocks.getDatabase.mockReturnValue({
      transaction: (callback: (transaction: typeof tx) => Promise<unknown>) =>
        callback(tx),
    });
    expect(
      await revokePortalMembership(membershipId, customerPortalManager()),
    ).toBe(false);
    expect(tx.update).not.toHaveBeenCalled();
  });

  it("revokes the membership, its open invitations, and records the event in one transaction", async () => {
    const membership = {
      id: membershipId,
      customer_id: "customer-a",
      person_id: "person-a",
      version: 2,
      revoked_at: null,
    };
    const membershipQuery = membershipQueryFor(membership);
    const assignmentQuery = {
      from: () => assignmentQuery,
      where: () => assignmentQuery,
      getSQL: () => sql`select 'assignment-a'`,
    };
    const updateQuery = {
      set: vi.fn(() => updateQuery),
      where: vi.fn().mockResolvedValue(undefined),
    };
    const tx = {
      select: vi.fn((columns?: unknown) =>
        columns ? assignmentQuery : membershipQuery,
      ),
      update: vi.fn(() => updateQuery),
    };
    mocks.getDatabase.mockReturnValue({
      transaction: (callback: (transaction: typeof tx) => Promise<unknown>) =>
        callback(tx),
    });
    mocks.updateVersioned.mockResolvedValue({ ok: true, value: membershipId });
    expect(
      await revokePortalMembership(membershipId, customerPortalManager()),
    ).toBe(true);
    expect(tx.update).toHaveBeenCalledTimes(1);
    expect(mocks.updateVersioned).toHaveBeenCalledWith(
      expect.objectContaining({
        id: membershipId,
        expectedVersion: 2,
        patch: { revoked_at: expect.any(Date) },
      }),
    );
    expect(mocks.securityEvent).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        subjectId: membershipId,
        metadata: { customerId: "customer-a" },
      }),
    );
  });
});
