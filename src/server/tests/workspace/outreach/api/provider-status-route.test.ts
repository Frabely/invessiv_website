import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

import { HttpResponseCode } from "@/common/constants/http/http-response-codes";
import { GET } from "@/app/api/workspace/outreach/provider-status/route";

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

function makeRequest(): NextRequest {
  return new Request(
    "http://localhost/api/workspace/outreach/provider-status",
    { method: "GET" },
  ) as unknown as NextRequest;
}

function setupAuthenticatedUser(): void {
  mockAuth.mockResolvedValue({ userId: "user_123" });
  mockCurrentUser.mockResolvedValue({
    primaryEmailAddressId: "email_primary",
    emailAddresses: [{ id: "email_primary", emailAddress: ALLOWED_EMAIL }],
  });
}

describe("GET /api/workspace/outreach/provider-status", () => {
  beforeEach(() => {
    vi.stubEnv("WORKSPACE_ALLOWED_EMAILS", ALLOWED_EMAIL);
    mockAuth.mockReset();
    mockCurrentUser.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 401 when the request is unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await GET(makeRequest());

    expect(response.status).toBe(HttpResponseCode.Unauthorized);
  });

  it("reports openai as available when OPENAI_API_KEY is set", async () => {
    setupAuthenticatedUser();
    vi.stubEnv("OPENAI_API_KEY", "sk-test-key");

    const response = await GET(makeRequest());

    expect(response.status).toBe(HttpResponseCode.Ok);
    const body = await response.json();
    expect(body).toMatchObject({
      ok: true,
      providers: {
        openai: { available: true },
      },
    });
  });

  it("reports openai as unavailable when OPENAI_API_KEY is not set", async () => {
    setupAuthenticatedUser();
    vi.stubEnv("OPENAI_API_KEY", "");

    const response = await GET(makeRequest());

    expect(response.status).toBe(HttpResponseCode.Ok);
    const body = await response.json();
    expect(body).toMatchObject({
      ok: true,
      providers: {
        openai: { available: false },
      },
    });
  });

  it("uses the default model when OPENAI_MODEL is not set", async () => {
    setupAuthenticatedUser();
    vi.stubEnv("OPENAI_API_KEY", "sk-test-key");

    const response = await GET(makeRequest());

    const body = await response.json();
    expect(body.providers.openai.model).toBe("gpt-4o-mini");
  });

  it("uses the custom model when OPENAI_MODEL is set", async () => {
    setupAuthenticatedUser();
    vi.stubEnv("OPENAI_API_KEY", "sk-test-key");
    vi.stubEnv("OPENAI_MODEL", "gpt-4o");

    const response = await GET(makeRequest());

    const body = await response.json();
    expect(body.providers.openai.model).toBe("gpt-4o");
  });

  it("does not include the API key in the response", async () => {
    setupAuthenticatedUser();
    vi.stubEnv("OPENAI_API_KEY", "sk-secret-key");

    const response = await GET(makeRequest());

    const text = await response.text();
    expect(text).not.toContain("sk-secret-key");
  });
});
