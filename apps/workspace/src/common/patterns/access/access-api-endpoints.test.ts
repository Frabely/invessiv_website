import { describe, expect, it } from "vitest";

import {
  clerkCandidatesEndpoint,
  workspaceMemberOwnerEndpoint,
  workspaceMemberRolesEndpoint,
  workspaceRoleEndpoint,
} from "@/common/patterns/access/access-api-endpoints";

describe("access api endpoints", () => {
  it("builds member and role paths from the endpoint constants", () => {
    expect(workspaceMemberRolesEndpoint("member-1")).toBe(
      "/api/workspace/members/member-1/roles",
    );
    expect(workspaceMemberOwnerEndpoint("member-1")).toBe(
      "/api/workspace/members/member-1/owner",
    );
    expect(workspaceRoleEndpoint("role-1")).toBe("/api/workspace/roles/role-1");
  });

  it("encodes ids so they cannot escape their path segment", () => {
    expect(workspaceRoleEndpoint("../leads")).toBe(
      "/api/workspace/roles/..%2Fleads",
    );
  });

  it("adds a trimmed search query only when one is given", () => {
    expect(clerkCandidatesEndpoint("  ")).toBe(
      "/api/workspace/members/clerk-candidates",
    );
    expect(clerkCandidatesEndpoint(" anna ")).toBe(
      "/api/workspace/members/clerk-candidates?query=anna",
    );
  });
});
