import { beforeEach, describe, expect, it, vi } from "vitest";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { PORTAL_READ_PERMISSION_VALUES } from "@invessiv/common/constants/auth/permission-definitions";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { SecuritySubjectType } from "@invessiv/common/constants/auth/security-subject-types";
import { isPortalOwnerView } from "./portal-owner-view";
import { resolvePortalOwnerView } from "./resolve-portal-owner-view";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  findActiveOwnerUserId: vi.fn(),
  createSecurityEvent: vi.fn(),
  customerRows: vi.fn(),
}));

vi.mock("@invessiv/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@invessiv/db/core")>()),
  getDrizzleDatabaseClient: mocks.getDatabase,
}));
vi.mock("@/server/shared/services/workspace-owner-lookup-service", () => ({
  workspaceOwnerLookupService: {
    findActiveOwnerUserId: mocks.findActiveOwnerUserId,
  },
}));
vi.mock("@/server/shared/services/security-event-service", () => ({
  securityEventService: { createSecurityEvent: mocks.createSecurityEvent },
}));

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const TX = {
  select: vi.fn(() => ({
    from: () => ({ where: () => ({ limit: mocks.customerRows }) }),
  })),
};

describe("resolvePortalOwnerView", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getDatabase.mockReturnValue({
      transaction: (callback: (tx: typeof TX) => Promise<unknown>) =>
        callback(TX),
    });
    mocks.findActiveOwnerUserId.mockResolvedValue("owner-user-uuid");
    mocks.customerRows.mockResolvedValue([{ id: CUSTOMER_ID }]);
    mocks.createSecurityEvent.mockResolvedValue(undefined);
  });

  it("builds a read-only owner view and records a security event", async () => {
    const view = await resolvePortalOwnerView("user_owner", CUSTOMER_ID);

    expect(view).not.toBeNull();
    expect(isPortalOwnerView(view!)).toBe(true);
    expect(view).toMatchObject({
      userId: "owner-user-uuid",
      customerId: CUSTOMER_ID,
    });
    expect([...view!.permissions]).toEqual([...PORTAL_READ_PERMISSION_VALUES]);
    expect(view!.permissions.has(Permission.PortalTasksComplete)).toBe(false);
    expect(mocks.findActiveOwnerUserId).toHaveBeenCalledWith(TX, "user_owner");
    expect(mocks.createSecurityEvent).toHaveBeenCalledExactlyOnceWith(
      TX,
      expect.objectContaining({
        type: SecurityEventType.PortalOwnerViewOpened,
        actor: { type: ActorType.User, userId: "owner-user-uuid" },
        subjectType: SecuritySubjectType.Customer,
        subjectId: CUSTOMER_ID,
        metadata: null,
      }),
    );
  });

  it("returns null for a workspace member without the owner role", async () => {
    mocks.findActiveOwnerUserId.mockResolvedValue(null);

    await expect(
      resolvePortalOwnerView("user_member", CUSTOMER_ID),
    ).resolves.toBeNull();
    expect(mocks.customerRows).not.toHaveBeenCalled();
    expect(mocks.createSecurityEvent).not.toHaveBeenCalled();
  });

  it("returns null for a customer that does not exist, without an event", async () => {
    mocks.customerRows.mockResolvedValue([]);

    await expect(
      resolvePortalOwnerView("user_owner", CUSTOMER_ID),
    ).resolves.toBeNull();
    expect(mocks.createSecurityEvent).not.toHaveBeenCalled();
  });

  it("propagates database errors so the gate fails closed", async () => {
    mocks.findActiveOwnerUserId.mockRejectedValue(new Error("db down"));

    await expect(
      resolvePortalOwnerView("user_owner", CUSTOMER_ID),
    ).rejects.toThrow("db down");
  });

  it("grants nothing when the security event cannot be written", async () => {
    mocks.createSecurityEvent.mockRejectedValue(new Error("check violation"));

    await expect(
      resolvePortalOwnerView("user_owner", CUSTOMER_ID),
    ).rejects.toThrow("check violation");
  });
});
