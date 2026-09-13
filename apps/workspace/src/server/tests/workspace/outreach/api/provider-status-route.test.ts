import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import {
  authorizedWorkspaceRequest,
  unauthenticatedWorkspaceRequest,
  unavailableWorkspaceRequest,
} from "@/server/tests/support/workspace-auth-fixtures";
import type { NextRequest } from "next/server";

import { OutreachOpenAi } from "@invessiv/common/constants/leads/outreach/lead-outreach-openai";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { GET } from "@/app/api/workspace/outreach/provider-status/route";

vi.mock("server-only", () => ({}));

const { mockAuthenticate } = vi.hoisted(() => ({
  mockAuthenticate: vi.fn(),
}));

vi.mock("@/lib/auth/workspace-authentication", () => ({
  authenticateWorkspaceRequest: mockAuthenticate,
}));

function makeRequest(): NextRequest {
  return new Request(
    "http://localhost/api/workspace/outreach/provider-status",
    { method: "GET" },
  ) as unknown as NextRequest;
}

function setupAuthenticatedUser(): void {
  mockAuthenticate.mockResolvedValue(authorizedWorkspaceRequest());
}

describe("GET /api/workspace/outreach/provider-status", () => {
  beforeEach(() => {
    mockAuthenticate.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 401 when the request is unauthenticated", async () => {
    mockAuthenticate.mockResolvedValue(unauthenticatedWorkspaceRequest());

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
    expect(body.providers.openai.model).toBe(OutreachOpenAi.DefaultModel);
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

describe("GET /api/workspace/outreach/provider-status permissions", () => {
  beforeEach(() => {
    mockAuthenticate.mockReset();
  });

  it("returns 403 without outreach.generate", async () => {
    mockAuthenticate.mockResolvedValue(
      authorizedWorkspaceRequest([Permission.LeadsRead]),
    );

    const response = await GET(makeRequest());

    expect(response.status).toBe(HttpResponseCode.Forbidden);
  });

  it("returns 503 when authorization is unavailable", async () => {
    mockAuthenticate.mockResolvedValue(unavailableWorkspaceRequest());

    const response = await GET(makeRequest());

    expect(response.status).toBe(HttpResponseCode.ServiceUnavailable);
  });
});
