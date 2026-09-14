import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { WorkspaceAuthStatus } from "@/common/constants/auth/workspace-auth-statuses";
import { withPermission, withWorkspaceApiActor } from "./api";

vi.mock("server-only", () => ({}));

const { mockAuthenticate } = vi.hoisted(() => ({
  mockAuthenticate: vi.fn(),
}));

vi.mock("./workspace-authentication", () => ({
  authenticateWorkspaceRequest: mockAuthenticate,
}));

const ACTOR = {
  userId: "user-uuid-1",
  workspaceMemberId: "member-uuid-1",
  permissions: new Set([Permission.LeadsRead]),
};

function makeRequest(url = "http://localhost/api/workspace/leads") {
  return new Request(url) as unknown as NextRequest;
}

describe("withWorkspaceApiActor", () => {
  beforeEach(() => {
    mockAuthenticate.mockReset();
  });

  it("returns 401 JSON when the request is unauthenticated", async () => {
    mockAuthenticate.mockResolvedValue({
      status: WorkspaceAuthStatus.Unauthenticated,
    });
    const inner = vi.fn();

    const response = await withWorkspaceApiActor(inner)(makeRequest());

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      ok: false,
      error: "UNAUTHORIZED",
    });
    expect(inner).not.toHaveBeenCalled();
  });

  it("returns 404 JSON for an account without membership", async () => {
    mockAuthenticate.mockResolvedValue({
      status: WorkspaceAuthStatus.NotMember,
    });
    const inner = vi.fn();

    const response = await withWorkspaceApiActor(inner)(makeRequest());

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ error: "NOT_FOUND" });
    expect(inner).not.toHaveBeenCalled();
  });

  it("returns 403 JSON for an inactive account", async () => {
    mockAuthenticate.mockResolvedValue({
      status: WorkspaceAuthStatus.Inactive,
    });
    const inner = vi.fn();

    const response = await withWorkspaceApiActor(inner)(makeRequest());

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: "FORBIDDEN" });
    expect(inner).not.toHaveBeenCalled();
  });

  it("returns 503 JSON and never calls the handler when authorization is unavailable", async () => {
    mockAuthenticate.mockResolvedValue({
      status: WorkspaceAuthStatus.Unavailable,
    });
    const inner = vi.fn();

    const response = await withWorkspaceApiActor(inner)(makeRequest());

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: "UNAVAILABLE" });
    expect(inner).not.toHaveBeenCalled();
  });

  it("passes the resolved actor to the handler", async () => {
    mockAuthenticate.mockResolvedValue({
      status: WorkspaceAuthStatus.Authorized,
      actor: ACTOR,
    });
    const inner = vi
      .fn()
      .mockResolvedValue(Response.json({ ok: true }, { status: 200 }));
    const request = makeRequest();

    const response = await withWorkspaceApiActor(inner)(request);

    expect(response.status).toBe(200);
    expect(inner).toHaveBeenCalledWith(request, ACTOR);
  });

  it("answers with JSON, never with a redirect", async () => {
    mockAuthenticate.mockResolvedValue({
      status: WorkspaceAuthStatus.Unauthenticated,
    });

    const response = await withWorkspaceApiActor(vi.fn())(makeRequest());

    expect(response.headers.get("content-type")).toContain("application/json");
  });
});

describe("withPermission", () => {
  beforeEach(() => {
    mockAuthenticate.mockReset();
    mockAuthenticate.mockResolvedValue({
      status: WorkspaceAuthStatus.Authorized,
      actor: ACTOR,
    });
  });

  it("calls the handler when the actor holds the permission", async () => {
    const inner = vi
      .fn()
      .mockResolvedValue(Response.json({ ok: true }, { status: 200 }));

    const response = await withPermission(
      Permission.LeadsRead,
      inner,
    )(makeRequest());

    expect(response.status).toBe(200);
    expect(inner).toHaveBeenCalledOnce();
  });

  it("returns 403 JSON and skips the handler when the permission is missing", async () => {
    const inner = vi.fn();

    const response = await withPermission(
      Permission.LeadsDelete,
      inner,
    )(makeRequest());

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      ok: false,
      error: "FORBIDDEN",
    });
    expect(inner).not.toHaveBeenCalled();
  });

  it("keeps the membership gate in front of the permission check", async () => {
    mockAuthenticate.mockResolvedValue({
      status: WorkspaceAuthStatus.NotMember,
    });

    const response = await withPermission(
      Permission.LeadsRead,
      vi.fn(),
    )(makeRequest());

    expect(response.status).toBe(404);
  });
});
