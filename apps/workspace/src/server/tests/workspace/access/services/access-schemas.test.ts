import { describe, expect, it } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { accessSchemas } from "@/server/workspace/access/services/access-schemas";

describe("accessSchemas.listClerkCandidates", () => {
  it("trims a body search and rejects values that could evade the URL privacy boundary", () => {
    expect(
      accessSchemas.listClerkCandidates.parse({ query: " anna@example.test " }),
    ).toEqual({ query: "anna@example.test" });
    expect(
      accessSchemas.listClerkCandidates.safeParse({ query: "a".repeat(101) })
        .success,
    ).toBe(false);
    expect(
      accessSchemas.listClerkCandidates.safeParse({ query: null }).success,
    ).toBe(false);
  });
});

describe("accessSchemas.listAccessCustomers", () => {
  it("trims the search and treats a missing one as the first page", () => {
    expect(
      accessSchemas.listAccessCustomers.parse({ search: "  Nordlicht " }),
    ).toEqual({ search: "Nordlicht" });
    expect(accessSchemas.listAccessCustomers.parse({})).toEqual({ search: "" });
  });

  it("rejects a search longer than the lookup limit", () => {
    expect(
      accessSchemas.listAccessCustomers.safeParse({ search: "a".repeat(100) })
        .success,
    ).toBe(true);
    expect(
      accessSchemas.listAccessCustomers.safeParse({ search: "a".repeat(101) })
        .success,
    ).toBe(false);
  });
});

const ROLE_ID = "0b0f1d8e-6a7c-4a44-9c3e-2f3f8f2b7a10";

describe("accessSchemas.createRole", () => {
  it("trims the name and stores an empty description as null", () => {
    const result = accessSchemas.createRole.safeParse({
      name: "  Sales  ",
      description: "   ",
      permissions: [Permission.LeadsRead],
      scopeAssignable: false,
    });

    expect(result.success && result.data).toEqual({
      name: "Sales",
      description: null,
      permissions: [Permission.LeadsRead],
      scopeAssignable: false,
    });
  });

  it("rejects a blank name, duplicate and unknown permissions", () => {
    expect(
      accessSchemas.createRole.safeParse({
        name: " ",
        description: null,
        permissions: [],
        scopeAssignable: false,
      }).success,
    ).toBe(false);
    expect(
      accessSchemas.createRole.safeParse({
        name: "Sales",
        description: null,
        permissions: [Permission.LeadsRead, Permission.LeadsRead],
        scopeAssignable: false,
      }).success,
    ).toBe(false);
    expect(
      accessSchemas.createRole.safeParse({
        name: "Sales",
        description: null,
        permissions: ["leads.teleport"],
        scopeAssignable: false,
      }).success,
    ).toBe(false);
  });

  it("requires an explicit role type", () => {
    expect(
      accessSchemas.createRole.safeParse({
        name: "Sales",
        description: null,
        permissions: [],
      }).success,
    ).toBe(false);
  });

  it("leaves delegability to the handler so it can answer with its own error code", () => {
    expect(
      accessSchemas.createRole.safeParse({
        name: "Escalation",
        description: null,
        permissions: [Permission.MembersManage],
        scopeAssignable: false,
      }).success,
    ).toBe(true);
  });
});

describe("accessSchemas.updateRole", () => {
  it("accepts the editable fields without the immutable role type", () => {
    expect(
      accessSchemas.updateRole.safeParse({
        name: "Sales",
        description: null,
        active: true,
        permissions: [Permission.LeadsRead],
        version: 1,
      }).success,
    ).toBe(true);
  });

  it("rejects a request that still carries scopeAssignable, since the type is immutable", () => {
    expect(
      accessSchemas.updateRole.safeParse({
        name: "Sales",
        description: null,
        active: true,
        permissions: [Permission.LeadsRead],
        version: 1,
        scopeAssignable: true,
      }).success,
    ).toBe(false);
  });
});

describe("accessSchemas.replaceWorkspaceMemberRoles", () => {
  it("requires a positive integer version and unique uuid role ids", () => {
    expect(
      accessSchemas.replaceWorkspaceMemberRoles.safeParse({
        roleIds: [ROLE_ID],
        version: 2,
      }).success,
    ).toBe(true);
    expect(
      accessSchemas.replaceWorkspaceMemberRoles.safeParse({
        roleIds: [ROLE_ID, ROLE_ID],
        version: 2,
      }).success,
    ).toBe(false);
    expect(
      accessSchemas.replaceWorkspaceMemberRoles.safeParse({
        roleIds: ["not-a-uuid"],
        version: 2,
      }).success,
    ).toBe(false);
    expect(
      accessSchemas.replaceWorkspaceMemberRoles.safeParse({
        roleIds: [],
        version: 0,
      }).success,
    ).toBe(false);
  });
});

describe("accessSchemas.addWorkspaceMember", () => {
  it("accepts only a clerk id and role ids", () => {
    const result = accessSchemas.addWorkspaceMember.safeParse({
      clerkUserId: " user_123 ",
      roleIds: [ROLE_ID],
      primaryEmail: "spoofed@example.test",
    });

    expect(result.success && result.data).toEqual({
      clerkUserId: "user_123",
      roleIds: [ROLE_ID],
    });
  });
});
