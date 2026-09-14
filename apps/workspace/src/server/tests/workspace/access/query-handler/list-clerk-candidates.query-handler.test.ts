import { beforeEach, describe, expect, it, vi } from "vitest";

import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { listClerkCandidates } from "@/server/workspace/access/query-handler/list-clerk-candidates.query-handler";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  fromUsers: vi.fn(),
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

describe("listClerkCandidates", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getDatabase.mockReturnValue({
      select: () => ({ from: mocks.fromUsers }),
    });
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

  it("passes every linked Clerk id to the paginated directory lookup", async () => {
    mocks.fromUsers.mockResolvedValue([
      { clerkUserId: "user_linked_a" },
      { clerkUserId: "user_linked_b" },
    ]);
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
        },
      ],
    });
  });
});
