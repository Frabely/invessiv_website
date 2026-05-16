import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

import { HttpResponseCode } from "@/common/constants/http/http-response-codes";
import { OutreachChannel } from "@/common/ai-outreach-generation/outreach-channels";
import { OutreachErrorCode } from "@/common/ai-outreach-generation/outreach-error-codes";
import { OutreachPromptKey } from "@/common/ai-outreach-generation/outreach-prompt-keys";
import { POST } from "@/app/api/workspace/outreach/build-prompt/route";

vi.mock("server-only", () => ({}));

const { mockAuth, mockCurrentUser, mockGetLeadById, mockBuildPromptMessages } =
  vi.hoisted(() => ({
    mockAuth: vi.fn(),
    mockCurrentUser: vi.fn(),
    mockGetLeadById: vi.fn(),
    mockBuildPromptMessages: vi.fn(),
  }));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
  currentUser: mockCurrentUser,
}));

vi.mock(
  "@/server/workspace/leads/query-handler/get-lead-by-id.query-handler",
  () => ({
    getLeadById: mockGetLeadById,
  }),
);

vi.mock("@/server/workspace/outreach/services/outreach-prompt-service", () => ({
  outreachPromptService: {
    buildPromptMessages: mockBuildPromptMessages,
  },
}));

const ALLOWED_EMAIL = "owner@example.com";
const LEAD_ID = "lead-uuid-123";

function makeRequest(body: unknown): NextRequest {
  return new Request("http://localhost/api/workspace/outreach/build-prompt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function setupAuthenticatedUser(): void {
  mockAuth.mockResolvedValue({ userId: "user_123" });
  mockCurrentUser.mockResolvedValue({
    primaryEmailAddressId: "email_primary",
    emailAddresses: [{ id: "email_primary", emailAddress: ALLOWED_EMAIL }],
  });
}

describe("POST /api/workspace/outreach/build-prompt", () => {
  beforeEach(() => {
    vi.stubEnv("WORKSPACE_ALLOWED_EMAILS", ALLOWED_EMAIL);
    mockAuth.mockReset();
    mockCurrentUser.mockReset();
    mockGetLeadById.mockReset();
    mockBuildPromptMessages.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the sanitized prompt bundle on success", async () => {
    setupAuthenticatedUser();
    mockGetLeadById.mockResolvedValue({
      id: LEAD_ID,
      displayName: "Anna Meyer",
    });
    mockBuildPromptMessages.mockReturnValue({
      systemPrompt: "system prompt",
      userPrompt: "user prompt",
    });

    const requestBody = {
      leadId: LEAD_ID,
      promptKey: OutreachPromptKey.FirstTouch,
      channel: OutreachChannel.Linkedin,
      includeImprovements: true,
      contextNote: "Bitte knapp",
    };

    const response = await POST(makeRequest(requestBody));

    expect(response.status).toBe(HttpResponseCode.Ok);
    expect(mockBuildPromptMessages).toHaveBeenCalledWith(
      expect.objectContaining({ id: LEAD_ID, displayName: "Anna Meyer" }),
      OutreachPromptKey.FirstTouch,
      OutreachChannel.Linkedin,
      {
        includeImprovements: true,
        contextNote: "Bitte knapp",
      },
    );

    const body = await response.json();
    expect(body).toEqual({
      systemPrompt: "system prompt",
      userPrompt: "user prompt",
    });
  });

  it("returns 404 when the lead does not exist", async () => {
    setupAuthenticatedUser();
    mockGetLeadById.mockResolvedValue(null);

    const response = await POST(
      makeRequest({
        leadId: LEAD_ID,
        promptKey: OutreachPromptKey.FirstTouch,
        channel: OutreachChannel.Linkedin,
        includeImprovements: false,
      }),
    );

    expect(response.status).toBe(HttpResponseCode.NotFound);
    const body = await response.json();
    expect(body).toMatchObject({ error: OutreachErrorCode.LeadNotFound });
  });
});
