import { beforeEach, describe, expect, it, vi } from "vitest";

import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { SecuritySubjectType } from "@invessiv/common/constants/auth/security-subject-types";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { updateMemberBookingUrl } from "@/server/workspace/access/command-handler/update-member-booking-url.command-handler";
import { workspaceActorWith } from "@/server/tests/support/workspace-auth-fixtures";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  findById: vi.fn(),
  updateBookingUrl: vi.fn(),
  createEvent: vi.fn(),
}));

vi.mock("@invessiv/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@invessiv/db/core")>()),
  getDrizzleDatabaseClient: mocks.getDatabase,
}));
vi.mock(
  "@/server/workspace/access/services/workspace-member-read-service",
  () => ({ workspaceMemberReadService: { findById: mocks.findById } }),
);
vi.mock(
  "@/server/workspace/access/services/workspace-member-version-service",
  () => ({
    workspaceMemberVersionService: {
      updateBookingUrl: mocks.updateBookingUrl,
    },
  }),
);
vi.mock("@/server/shared/services/security-event-service", () => ({
  securityEventService: { createSecurityEvent: mocks.createEvent },
}));

const MEMBER_ID = "3f0e8d4c-6a1b-4f55-9d7e-1c2b3a4d5e6f";
const LINK = "https://calendly.com/anna/onboarding";
const MEMBER: WorkspaceMemberDto = {
  id: MEMBER_ID,
  userId: "user-2",
  displayName: "Anna Beispiel",
  primaryEmail: "anna@example.test",
  active: true,
  isOwner: false,
  hasActiveRole: true,
  accessScopeCount: 0,
  bookingUrl: null,
  roles: [],
  version: 3,
  createdAt: "2026-09-13T10:00:00.000Z",
};
const manager = { ...workspaceActorWith(), workspaceMemberId: "actor-member" };
const self = { ...workspaceActorWith([]), workspaceMemberId: MEMBER_ID };

describe("updateMemberBookingUrl", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getDatabase.mockReturnValue({
      transaction: (callback: (tx: object) => Promise<unknown>) => callback({}),
    });
    mocks.updateBookingUrl.mockResolvedValue({ ok: true });
  });

  it("rejects an id that is no uuid and an unknown member as not found", async () => {
    expect(
      await updateMemberBookingUrl(
        "me",
        { bookingUrl: LINK, version: 3 },
        manager,
      ),
    ).toEqual({ ok: false, code: WorkspaceMemberErrorCode.MemberNotFound });
    expect(mocks.getDatabase).not.toHaveBeenCalled();

    mocks.findById.mockResolvedValue(null);
    expect(
      await updateMemberBookingUrl(
        MEMBER_ID,
        { bookingUrl: LINK, version: 3 },
        manager,
      ),
    ).toEqual({ ok: false, code: WorkspaceMemberErrorCode.MemberNotFound });
    expect(mocks.updateBookingUrl).not.toHaveBeenCalled();
  });

  it.each([
    ["http://calendly.com/anna"],
    ["javascript:alert(1)"],
    [`https://calendly.com/${"a".repeat(2048)}`],
  ])("rejects %s before opening a transaction", async (bookingUrl) => {
    const result = await updateMemberBookingUrl(
      MEMBER_ID,
      { bookingUrl, version: 3 },
      manager,
    );

    expect(result).toMatchObject({
      ok: false,
      code: WorkspaceMemberErrorCode.ValidationError,
    });
    expect(mocks.getDatabase).not.toHaveBeenCalled();
  });

  it("writes exactly one security event when someone else's link changes", async () => {
    mocks.findById
      .mockResolvedValueOnce(MEMBER)
      .mockResolvedValueOnce({ ...MEMBER, bookingUrl: LINK, version: 4 });

    const result = await updateMemberBookingUrl(
      MEMBER_ID,
      { bookingUrl: ` ${LINK} `, version: 3 },
      manager,
    );

    expect(result).toEqual({
      ok: true,
      member: { ...MEMBER, bookingUrl: LINK, version: 4 },
    });
    expect(mocks.updateBookingUrl).toHaveBeenCalledWith(
      expect.anything(),
      MEMBER_ID,
      3,
      LINK,
    );
    expect(mocks.createEvent).toHaveBeenCalledTimes(1);
    const [, event] = mocks.createEvent.mock.calls[0]!;
    expect(event).toMatchObject({
      type: SecurityEventType.WorkspaceMemberBookingUrlChanged,
      subjectType: SecuritySubjectType.WorkspaceMember,
      subjectId: MEMBER_ID,
      metadata: { changedFields: ["bookingUrl"], cleared: false },
    });
    // The link is customer-facing data, not audit data.
    expect(JSON.stringify(event)).not.toContain("calendly");
  });

  it("writes no security event for the own link", async () => {
    mocks.findById
      .mockResolvedValueOnce(MEMBER)
      .mockResolvedValueOnce({ ...MEMBER, bookingUrl: LINK, version: 4 });

    const result = await updateMemberBookingUrl(
      MEMBER_ID,
      { bookingUrl: LINK, version: 3 },
      self,
    );

    expect(result.ok).toBe(true);
    expect(mocks.updateBookingUrl).toHaveBeenCalledTimes(1);
    expect(mocks.createEvent).not.toHaveBeenCalled();
  });

  it("clears the link and records that it was cleared", async () => {
    mocks.findById
      .mockResolvedValueOnce({ ...MEMBER, bookingUrl: LINK })
      .mockResolvedValueOnce({ ...MEMBER, version: 4 });

    const result = await updateMemberBookingUrl(
      MEMBER_ID,
      { bookingUrl: "", version: 3 },
      manager,
    );

    expect(result).toEqual({ ok: true, member: { ...MEMBER, version: 4 } });
    expect(mocks.updateBookingUrl).toHaveBeenCalledWith(
      expect.anything(),
      MEMBER_ID,
      3,
      null,
    );
    expect(mocks.createEvent.mock.calls[0]![1]).toMatchObject({
      metadata: { cleared: true },
    });
  });

  it("neither bumps the version nor writes an event for an unchanged link", async () => {
    mocks.findById.mockResolvedValue({ ...MEMBER, bookingUrl: LINK });

    const result = await updateMemberBookingUrl(
      MEMBER_ID,
      { bookingUrl: LINK, version: 3 },
      manager,
    );

    expect(result).toEqual({
      ok: true,
      member: { ...MEMBER, bookingUrl: LINK },
    });
    expect(mocks.updateBookingUrl).not.toHaveBeenCalled();
    expect(mocks.createEvent).not.toHaveBeenCalled();
  });

  it("passes a version conflict through without an event", async () => {
    const conflict = {
      code: ConcurrencyErrorCode.VersionConflict,
      currentVersion: 5,
      current: { ...MEMBER, version: 5 },
    };
    mocks.findById.mockResolvedValue(MEMBER);
    mocks.updateBookingUrl.mockResolvedValue({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict,
    });

    const result = await updateMemberBookingUrl(
      MEMBER_ID,
      { bookingUrl: LINK, version: 3 },
      manager,
    );

    expect(result).toEqual({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict,
    });
    expect(mocks.createEvent).not.toHaveBeenCalled();
  });
});
