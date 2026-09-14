import { beforeEach, describe, expect, it, vi } from "vitest";

import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { users } from "@invessiv/db/record-configuration";
import { syncWorkspaceMemberProfiles } from "@/server/workspace/access/command-handler/sync-workspace-member-profiles.command-handler";
import type { ClerkUserProfile } from "@/server/workspace/auth/clerk-user-profile-types";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  linkedUsers: vi.fn(),
  transaction: vi.fn(),
  listProfilesByIds: vi.fn(),
  updateVersioned: vi.fn(),
}));

vi.mock("@invessiv/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@invessiv/db/core")>()),
  getDrizzleDatabaseClient: mocks.getDatabase,
}));
vi.mock("@/server/workspace/access/services/clerk-directory-service", () => ({
  clerkDirectoryService: { listProfilesByIds: mocks.listProfilesByIds },
}));
vi.mock("@/server/workspace/shared/update-versioned", () => ({
  updateVersioned: mocks.updateVersioned,
}));

const ANNA = {
  id: "user-1",
  clerk_user_id: "user_anna",
  primary_email: "anna@example.test",
  first_name: "Anna",
  last_name: "Beispiel",
  display_name: "Anna Beispiel",
  version: 3,
};
const BEN = {
  id: "user-2",
  clerk_user_id: "user_ben",
  primary_email: "ben@example.test",
  first_name: "Ben",
  last_name: null,
  display_name: "Ben",
  version: 1,
};

function profileOf(
  user: typeof ANNA | typeof BEN,
  overrides: Partial<ClerkUserProfile> = {},
): ClerkUserProfile {
  return {
    clerkUserId: user.clerk_user_id,
    primaryEmail: user.primary_email,
    firstName: user.first_name,
    lastName: user.last_name,
    displayName: user.display_name,
    ...overrides,
  };
}

describe("syncWorkspaceMemberProfiles", () => {
  const tx = { name: "tx" };

  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getDatabase.mockReturnValue({
      select: () => ({ from: () => ({ innerJoin: mocks.linkedUsers }) }),
      transaction: mocks.transaction,
    });
    mocks.transaction.mockImplementation(
      (callback: (value: unknown) => Promise<unknown>) => callback(tx),
    );
    mocks.updateVersioned.mockResolvedValue({ ok: true, value: "user-1" });
  });

  it("does not ask Clerk while no member exists", async () => {
    mocks.linkedUsers.mockResolvedValue([]);

    await syncWorkspaceMemberProfiles();

    expect(mocks.listProfilesByIds).not.toHaveBeenCalled();
  });

  it("keeps the stored data when Clerk is unavailable", async () => {
    mocks.linkedUsers.mockResolvedValue([ANNA]);
    mocks.listProfilesByIds.mockResolvedValue({
      ok: false,
      code: WorkspaceMemberErrorCode.ClerkUnavailable,
    });

    await expect(syncWorkspaceMemberProfiles()).resolves.toBeUndefined();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("writes nothing when Clerk reports the stored master data", async () => {
    mocks.linkedUsers.mockResolvedValue([ANNA, BEN]);
    mocks.listProfilesByIds.mockResolvedValue({
      ok: true,
      profiles: [profileOf(ANNA), profileOf(BEN)],
    });

    await syncWorkspaceMemberProfiles();

    expect(mocks.listProfilesByIds).toHaveBeenCalledWith([
      "user_anna",
      "user_ben",
    ]);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("updates changed accounts through updateVersioned and skips accounts Clerk no longer returns", async () => {
    mocks.linkedUsers.mockResolvedValue([ANNA, BEN]);
    mocks.listProfilesByIds.mockResolvedValue({
      ok: true,
      profiles: [
        profileOf(ANNA, { lastName: "Muster", displayName: "Anna Muster" }),
      ],
    });

    await syncWorkspaceMemberProfiles();

    expect(mocks.updateVersioned).toHaveBeenCalledTimes(1);
    expect(mocks.updateVersioned).toHaveBeenCalledWith(
      expect.objectContaining({
        tx,
        table: users,
        id: "user-1",
        expectedVersion: 3,
        patch: {
          primary_email: "anna@example.test",
          first_name: "Anna",
          last_name: "Muster",
          display_name: "Anna Muster",
        },
      }),
    );
  });

  it("keeps the stored address when the Clerk account has no primary email", async () => {
    mocks.linkedUsers.mockResolvedValue([ANNA]);
    mocks.listProfilesByIds.mockResolvedValue({
      ok: true,
      profiles: [profileOf(ANNA, { primaryEmail: null })],
    });

    await syncWorkspaceMemberProfiles();
    expect(mocks.transaction).not.toHaveBeenCalled();

    mocks.listProfilesByIds.mockResolvedValue({
      ok: true,
      profiles: [
        profileOf(ANNA, { primaryEmail: null, displayName: "Anna B." }),
      ],
    });

    await syncWorkspaceMemberProfiles();
    expect(mocks.updateVersioned.mock.calls[0][0].patch).toMatchObject({
      primary_email: "anna@example.test",
      display_name: "Anna B.",
    });
  });

  it("does not fail the render when a parallel render already bumped the version", async () => {
    mocks.linkedUsers.mockResolvedValue([ANNA]);
    mocks.listProfilesByIds.mockResolvedValue({
      ok: true,
      profiles: [profileOf(ANNA, { displayName: "Anna B." })],
    });
    mocks.updateVersioned.mockResolvedValue({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict: {
        code: ConcurrencyErrorCode.VersionConflict,
        currentVersion: 4,
        current: "user-1",
      },
    });

    await expect(syncWorkspaceMemberProfiles()).resolves.toBeUndefined();
  });
});
