import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { OutreachChannel } from "@invessiv/common/constants/leads/outreach/lead-outreach-channels";
import { OutreachErrorCode } from "@invessiv/common/constants/leads/outreach/lead-outreach-error-codes";
import { POST } from "@/app/api/workspace/outreach/generate/route";

vi.mock("server-only", () => ({}));

const { mockAuth, mockCurrentUser, mockGenerateOutreach } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockCurrentUser: vi.fn(),
  mockGenerateOutreach: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
  currentUser: mockCurrentUser,
}));

vi.mock(
  "@/server/workspace/outreach/command-handler/generate-outreach-message.command-handler",
  () => ({ generateOutreachMessage: mockGenerateOutreach }),
);

const ALLOWED_EMAIL = "owner@example.com";
const LEAD_ID = "lead-uuid-123";

function makeRequest(body: unknown): NextRequest {
  return new Request("http://localhost/api/workspace/outreach/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function makeInvalidJsonRequest(): NextRequest {
  return new Request("http://localhost/api/workspace/outreach/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "not-json",
  }) as unknown as NextRequest;
}

function setupAuthenticatedUser(): void {
  mockAuth.mockResolvedValue({ userId: "user_123" });
  mockCurrentUser.mockResolvedValue({
    primaryEmailAddressId: "email_primary",
    emailAddresses: [{ id: "email_primary", emailAddress: ALLOWED_EMAIL }],
  });
}

describe("POST /api/workspace/outreach/generate", () => {
  beforeEach(() => {
    vi.stubEnv("WORKSPACE_ALLOWED_EMAILS", ALLOWED_EMAIL);
    mockAuth.mockReset();
    mockCurrentUser.mockReset();
    mockGenerateOutreach.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 401 when the request is unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await POST(
      makeRequest({
        leadId: LEAD_ID,
        channel: OutreachChannel.Linkedin,
      }),
    );

    expect(response.status).toBe(HttpResponseCode.Unauthorized);
    expect(mockGenerateOutreach).not.toHaveBeenCalled();
  });

  it("returns 200 with the generated outreach payload on success", async () => {
    setupAuthenticatedUser();
    mockGenerateOutreach.mockResolvedValue({
      ok: true,
      channel: OutreachChannel.Email,
      subject: "Kurzer Betreff",
      body: "Email body",
    });

    const requestBody = {
      leadId: LEAD_ID,
      channel: OutreachChannel.Email,
      contextNote: "Bitte auf Englisch",
    };

    const response = await POST(makeRequest(requestBody));

    expect(response.status).toBe(HttpResponseCode.Ok);
    expect(mockGenerateOutreach).toHaveBeenCalledWith(requestBody);
    const body = await response.json();
    expect(body).toMatchObject({
      ok: true,
      channel: OutreachChannel.Email,
      subject: "Kurzer Betreff",
      body: "Email body",
    });
  });

  it("returns 400 when the request body fails schema validation", async () => {
    setupAuthenticatedUser();

    const response = await POST(
      makeRequest({
        leadId: LEAD_ID,
        channel: "whatsapp",
      }),
    );

    expect(response.status).toBe(HttpResponseCode.BadRequest);
    const body = await response.json();
    expect(body).toMatchObject({ error: OutreachErrorCode.ValidationError });
    expect(body).toHaveProperty("details");
    expect(mockGenerateOutreach).not.toHaveBeenCalled();
  });

  it("returns 400 when the request body is not valid JSON", async () => {
    setupAuthenticatedUser();

    const response = await POST(makeInvalidJsonRequest());

    expect(response.status).toBe(HttpResponseCode.BadRequest);
    const body = await response.json();
    expect(body).toMatchObject({ error: OutreachErrorCode.ValidationError });
    expect(mockGenerateOutreach).not.toHaveBeenCalled();
  });

  it("returns 404 when the lead does not exist", async () => {
    setupAuthenticatedUser();
    mockGenerateOutreach.mockResolvedValue({
      ok: false,
      code: OutreachErrorCode.LeadNotFound,
    });

    const response = await POST(
      makeRequest({
        leadId: LEAD_ID,
        channel: OutreachChannel.Linkedin,
      }),
    );

    expect(response.status).toBe(HttpResponseCode.NotFound);
    const body = await response.json();
    expect(body).toMatchObject({
      error: OutreachErrorCode.LeadNotFound,
      message: "Lead not found",
    });
  });

  it("returns 503 when the provider is unavailable", async () => {
    setupAuthenticatedUser();
    mockGenerateOutreach.mockResolvedValue({
      ok: false,
      code: OutreachErrorCode.ProviderUnavailable,
    });

    const response = await POST(
      makeRequest({
        leadId: LEAD_ID,
        channel: OutreachChannel.Linkedin,
      }),
    );

    expect(response.status).toBe(HttpResponseCode.ServiceUnavailable);
    const body = await response.json();
    expect(body).toMatchObject({
      error: OutreachErrorCode.ProviderUnavailable,
      message: "Outreach provider unavailable",
    });
  });

  it("returns 500 when the command handler throws an unexpected error", async () => {
    setupAuthenticatedUser();
    mockGenerateOutreach.mockRejectedValue(new Error("database is down"));

    const response = await POST(
      makeRequest({
        leadId: LEAD_ID,
        channel: OutreachChannel.Linkedin,
      }),
    );

    expect(response.status).toBe(HttpResponseCode.InternalServerError);
    const body = await response.json();
    expect(body).toMatchObject({ error: OutreachErrorCode.Internal });
  });
});
