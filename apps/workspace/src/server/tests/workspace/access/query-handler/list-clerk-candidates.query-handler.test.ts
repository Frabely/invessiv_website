import { beforeEach, describe, expect, it, vi } from "vitest";

import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { listClerkCandidates } from "@/server/workspace/access/query-handler/list-clerk-candidates.query-handler";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  listCandidateProfiles: vi.fn(),
}));

vi.mock("@invessiv/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@invessiv/db/core")>()),
  getDrizzleDatabaseClient: mocks.getDatabase,
}));
vi.mock("@/server/workspace/access/services/clerk-directory-service", () => ({
  clerkDirectoryService: {
    listCandidateProfiles: mocks.listCandidateProfiles,
  },
}));

function databaseWith(
  linkedClerkUserIds: readonly string[] = [],
  portalLinkedClerkUserIds: readonly string[] = [],
) {
  let lookupIndex = 0;
  return {
    select: () => {
      lookupIndex += 1;
      if (lookupIndex === 1) {
        return {
          from: () => ({
            innerJoin: () =>
              Promise.resolve(
                linkedClerkUserIds.map((clerk_user_id) => ({ clerk_user_id })),
              ),
          }),
        };
      }

      return {
        from: () => ({
          innerJoin: () => ({
            where: () =>
              Promise.resolve(
                portalLinkedClerkUserIds.map((clerk_user_id) => ({
                  clerk_user_id,
                })),
              ),
          }),
        }),
      };
    },
  };
}

describe("listClerkCandidates", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getDatabase.mockReturnValue(databaseWith());
  });

  it("rejects invalid input before reading the database or Clerk", async () => {
    const result = await listClerkCandidates({ query: "a".repeat(101) });

    expect(result).toMatchObject({
      ok: false,
      code: WorkspaceMemberErrorCode.ValidationError,
    });
    expect(mocks.getDatabase).not.toHaveBeenCalled();
    expect(mocks.listCandidateProfiles).not.toHaveBeenCalled();
  });

  it("excludes only accounts that already have a workspace_members row", async () => {
    mocks.getDatabase.mockReturnValue(
      databaseWith(["user_linked_a", "user_linked_b"]),
    );
    mocks.listCandidateProfiles.mockResolvedValue({
      ok: true,
      profiles: [
        {
          clerkUserId: "user_available",
          displayName: "Anna Beispiel",
          primaryEmail: "anna@example.test",
        },
      ],
    });

    const result = await listClerkCandidates({ query: " anna " });

    expect(mocks.listCandidateProfiles).toHaveBeenCalledWith(
      "anna",
      new Set(["user_linked_a", "user_linked_b"]),
    );
    expect(result).toEqual({
      ok: true,
      candidates: [
        {
          clerkUserId: "user_available",
          displayName: "Anna Beispiel",
          primaryEmail: "anna@example.test",
          hasPortalMembership: false,
        },
      ],
    });
  });

  it("marks a candidate that already has an active portal membership", async () => {
    mocks.getDatabase.mockReturnValue(databaseWith([], ["user_portal"]));
    mocks.listCandidateProfiles.mockResolvedValue({
      ok: true,
      profiles: [
        {
          clerkUserId: "user_portal",
          displayName: "Ben Beispiel",
          primaryEmail: "ben@example.test",
        },
      ],
    });

    const result = await listClerkCandidates({ query: "" });

    expect(result).toEqual({
      ok: true,
      candidates: [
        {
          clerkUserId: "user_portal",
          displayName: "Ben Beispiel",
          primaryEmail: "ben@example.test",
          hasPortalMembership: true,
        },
      ],
    });
  });
});
