import { afterEach, describe, expect, it, vi } from "vitest";

import { BootstrapWorkspaceOwnerError } from "@/common/constants/auth/bootstrap-workspace-owner-errors";
import { bootstrapWorkspaceOwner } from "@/server/workspace/auth/command-handler/bootstrap-workspace-owner.command-handler";

vi.mock("server-only", () => ({}));

const { mockGetDatabase } = vi.hoisted(() => ({
  mockGetDatabase: vi.fn(),
}));

vi.mock("@invessiv/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@invessiv/db/core")>()),
  getDrizzleDatabaseClient: mockGetDatabase,
}));

describe("bootstrapWorkspaceOwner", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    mockGetDatabase.mockReset();
  });

  it("rejects an identity other than the configured bootstrap user before touching the database", async () => {
    vi.stubEnv("WORKSPACE_BOOTSTRAP_CLERK_USER_ID", "user_owner");

    await expect(
      bootstrapWorkspaceOwner({
        clerkUserId: "user_intruder",
        primaryEmail: "intruder@example.test",
        firstName: null,
        lastName: null,
        displayName: "Intruder",
      }),
    ).resolves.toEqual({
      ok: false,
      code: BootstrapWorkspaceOwnerError.IdentityMismatch,
    });
    expect(mockGetDatabase).not.toHaveBeenCalled();
  });
});
