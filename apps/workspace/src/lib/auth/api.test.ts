import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { withWorkspaceApiAuth } from "./api";

vi.mock("server-only", () => ({}));

const { mockAuth, mockCurrentUser } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockCurrentUser: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
  currentUser: mockCurrentUser,
}));

const ALLOWED_EMAIL = "owner@example.com";

function buildClerkUser(options: {
  primaryEmailAddressId?: string;
  emails?: Array<{ id: string; emailAddress: string }>;
}) {
  return {
    primaryEmailAddressId: options.primaryEmailAddressId ?? "email_primary",
    emailAddresses: options.emails ?? [],
  };
}

function makeRequest(url = "http://localhost/api/workspace/leads") {
  return new Request(url) as unknown as NextRequest;
}

describe("withWorkspaceApiAuth", () => {
  beforeEach(() => {
    vi.stubEnv("WORKSPACE_ALLOWED_EMAILS", ALLOWED_EMAIL);
    mockAuth.mockReset();
    mockCurrentUser.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 401 JSON when the request is unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const handler = withWorkspaceApiAuth(vi.fn());
    const response = await handler(makeRequest());

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toMatchObject({ ok: false, error: "UNAUTHORIZED" });
    expect(mockCurrentUser).not.toHaveBeenCalled();
  });

  it("returns 401 JSON when currentUser returns null", async () => {
    mockAuth.mockResolvedValue({ userId: "user_123" });
    mockCurrentUser.mockResolvedValue(null);

    const handler = withWorkspaceApiAuth(vi.fn());
    const response = await handler(makeRequest());

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toMatchObject({ ok: false, error: "UNAUTHORIZED" });
  });

  it("returns 401 JSON when the user has no primary email", async () => {
    mockAuth.mockResolvedValue({ userId: "user_123" });
    mockCurrentUser.mockResolvedValue(
      buildClerkUser({ primaryEmailAddressId: "email_primary", emails: [] }),
    );

    const handler = withWorkspaceApiAuth(vi.fn());
    const response = await handler(makeRequest());

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toMatchObject({ ok: false, error: "UNAUTHORIZED" });
  });

  it("returns 404 JSON when the primary email is not on the allowlist", async () => {
    mockAuth.mockResolvedValue({ userId: "user_123" });
    mockCurrentUser.mockResolvedValue(
      buildClerkUser({
        primaryEmailAddressId: "email_primary",
        emails: [{ id: "email_primary", emailAddress: "intruder@example.com" }],
      }),
    );

    const handler = withWorkspaceApiAuth(vi.fn());
    const response = await handler(makeRequest());

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toMatchObject({ ok: false, error: "NOT_FOUND" });
  });

  it("calls the inner handler and returns its response when authenticated and allowed", async () => {
    mockAuth.mockResolvedValue({ userId: "user_123" });
    mockCurrentUser.mockResolvedValue(
      buildClerkUser({
        primaryEmailAddressId: "email_primary",
        emails: [{ id: "email_primary", emailAddress: ALLOWED_EMAIL }],
      }),
    );

    const innerHandler = vi
      .fn()
      .mockResolvedValue(
        Response.json({ ok: true, data: "leads" }, { status: 200 }),
      );

    const request = makeRequest();
    const handler = withWorkspaceApiAuth(innerHandler);
    const response = await handler(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ ok: true, data: "leads" });
    expect(innerHandler).toHaveBeenCalledWith(request, {
      userId: "user_123",
      email: ALLOWED_EMAIL,
    });
  });

  it("passes the access record with the exact email from Clerk (preserving case)", async () => {
    mockAuth.mockResolvedValue({ userId: "user_456" });
    mockCurrentUser.mockResolvedValue(
      buildClerkUser({
        primaryEmailAddressId: "email_primary",
        emails: [{ id: "email_primary", emailAddress: "OWNER@Example.com" }],
      }),
    );

    const innerHandler = vi
      .fn()
      .mockResolvedValue(Response.json({ ok: true }, { status: 200 }));

    await withWorkspaceApiAuth(innerHandler)(makeRequest());

    expect(innerHandler).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: "user_456",
        email: "OWNER@Example.com",
      }),
    );
  });

  it("does not call redirect or notFound — returns plain JSON errors only", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const handler = withWorkspaceApiAuth(vi.fn());
    const response = await handler(makeRequest());

    expect(response).toBeInstanceOf(Response);
    expect(response.headers.get("content-type")).toContain("application/json");
  });
});
