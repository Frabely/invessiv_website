import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

import { HttpResponseCode } from "@/common/constants/http/http-response-codes";
import { OutreachChannel } from "@/common/ai-outreach-generation/outreach-channels";
import { OutreachErrorCode } from "@/common/ai-outreach-generation/outreach-error-codes";
import { OutreachPromptKey } from "@/common/ai-outreach-generation/outreach-prompt-keys";
import { PostgresErrorCode } from "@/server/db/core";
import { POST } from "@/app/api/workspace/outreach/save-generated-message/route";

vi.mock("server-only", () => ({}));

const { mockAuth, mockCurrentUser, mockAppendLeadActivity, mockParse } =
  vi.hoisted(() => ({
    mockAuth: vi.fn(),
    mockCurrentUser: vi.fn(),
    mockAppendLeadActivity: vi.fn(),
    mockParse: vi.fn(),
  }));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
  currentUser: mockCurrentUser,
}));

vi.mock("@/server/workspace/leads/services/lead-activity-service", () => ({
  appendLeadActivity: mockAppendLeadActivity,
}));

vi.mock("@/server/workspace/outreach/services/outreach-message-parser", () => ({
  outreachMessageParser: {
    parse: mockParse,
  },
}));

const ALLOWED_EMAIL = "owner@example.com";
const LEAD_ID = "lead-uuid-123";

function makeRequest(body: unknown): NextRequest {
  return new Request(
    "http://localhost/api/workspace/outreach/save-generated-message",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  ) as unknown as NextRequest;
}

function setupAuthenticatedUser(): void {
  mockAuth.mockResolvedValue({ userId: "user_123" });
  mockCurrentUser.mockResolvedValue({
    primaryEmailAddressId: "email_primary",
    emailAddresses: [{ id: "email_primary", emailAddress: ALLOWED_EMAIL }],
  });
}

describe("POST /api/workspace/outreach/save-generated-message", () => {
  beforeEach(() => {
    vi.stubEnv("WORKSPACE_ALLOWED_EMAILS", ALLOWED_EMAIL);
    mockAuth.mockReset();
    mockCurrentUser.mockReset();
    mockAppendLeadActivity.mockReset();
    mockParse.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("persists the generated message and returns the parsed payload", async () => {
    setupAuthenticatedUser();
    mockParse.mockReturnValue({
      subject: "Kurzer Website-Gedanke",
      body: "Hallo Anna, ich habe eine kleine Beobachtung.",
    });
    mockAppendLeadActivity.mockResolvedValue(undefined);

    const requestBody = {
      channel: OutreachChannel.Email,
      leadId: LEAD_ID,
      promptKey: OutreachPromptKey.FirstTouch,
      rawText:
        "Betreff: Kurzer Website-Gedanke\n\nHallo Anna, ich habe eine kleine Beobachtung.",
    };

    const response = await POST(makeRequest(requestBody));

    expect(response.status).toBe(HttpResponseCode.Ok);
    expect(mockParse).toHaveBeenCalledWith(
      OutreachChannel.Email,
      requestBody.rawText,
    );
    expect(mockAppendLeadActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        leadId: LEAD_ID,
        body: "Hallo Anna, ich habe eine kleine Beobachtung.",
      }),
    );

    const body = await response.json();
    expect(body).toMatchObject({
      ok: true,
      channel: OutreachChannel.Email,
      promptKey: OutreachPromptKey.FirstTouch,
      subject: "Kurzer Website-Gedanke",
      body: "Hallo Anna, ich habe eine kleine Beobachtung.",
    });
  });

  it("returns 404 when the lead no longer exists", async () => {
    setupAuthenticatedUser();
    mockParse.mockReturnValue({
      body: "Hallo",
    });
    mockAppendLeadActivity.mockRejectedValue({
      code: PostgresErrorCode.ForeignKeyViolation,
    });

    const response = await POST(
      makeRequest({
        channel: OutreachChannel.Linkedin,
        leadId: LEAD_ID,
        promptKey: OutreachPromptKey.FirstTouch,
        rawText: "Hallo",
      }),
    );

    expect(response.status).toBe(HttpResponseCode.NotFound);
    const body = await response.json();
    expect(body).toMatchObject({ error: OutreachErrorCode.LeadNotFound });
  });
});
