import { afterEach, describe, expect, it, vi } from "vitest";
import { workspaceBootstrapIdentityService } from "@/server/workspace/auth/services/workspace-bootstrap-identity-service";

vi.mock("server-only", () => ({}));

describe("workspaceBootstrapIdentityService.matches", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("matches only the configured Clerk user id", () => {
    vi.stubEnv("WORKSPACE_BOOTSTRAP_CLERK_USER_ID", "  user_owner  ");

    expect(workspaceBootstrapIdentityService.matches("user_owner")).toBe(true);
    expect(workspaceBootstrapIdentityService.matches("user_intruder")).toBe(
      false,
    );
  });

  it("never matches when the environment variable is missing or blank", () => {
    vi.stubEnv("WORKSPACE_BOOTSTRAP_CLERK_USER_ID", "   ");

    expect(workspaceBootstrapIdentityService.matches("user_owner")).toBe(false);
  });
});
