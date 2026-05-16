import { afterEach, describe, expect, it, vi } from "vitest";
import type { GenerateOutreachRequestDto } from "@/common/ai-outreach-generation/generate-outreach-request.dto";
import { OutreachChannel } from "@/common/ai-outreach-generation/outreach-channels";
import { OutreachPromptKey } from "@/common/ai-outreach-generation/outreach-prompt-keys";
import { OutreachErrorCode } from "@/common/ai-outreach-generation/outreach-error-codes";
import { LeadActivityType } from "@/common/constants/leads/activity/lead-activity-types";
import { LeadActorType } from "@/common/constants/leads/activity/lead-actor-types";
import { generateOutreach } from "@/server/workspace/outreach/command-handler/generate-outreach-command-handler";

const {
  getLeadByIdMock,
  buildPromptMessagesMock,
  generateMock,
  parseMock,
  appendLeadActivityMock,
} = vi.hoisted(() => ({
  getLeadByIdMock: vi.fn(),
  buildPromptMessagesMock: vi
    .fn()
    .mockReturnValue({ systemPrompt: "system", userPrompt: "user" }),
  generateMock: vi.fn(),
  parseMock: vi.fn(),
  appendLeadActivityMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("server-only", () => ({}));
vi.mock(
  "@/server/workspace/leads/query-handler/get-lead-by-id.query-handler",
  () => ({ getLeadById: getLeadByIdMock }),
);
vi.mock("@/server/workspace/outreach/services/outreach-prompt-service", () => ({
  outreachPromptService: { buildPromptMessages: buildPromptMessagesMock },
}));
vi.mock("@/server/workspace/outreach/services/outreach-ai-service", () => ({
  outreachAiService: { generate: generateMock },
}));
vi.mock("@/server/workspace/outreach/services/outreach-message-parser", () => ({
  outreachMessageParser: { parse: parseMock },
}));
vi.mock("@/server/workspace/leads/services/lead-activity-service", () => ({
  appendLeadActivity: appendLeadActivityMock,
}));

const MOCK_LEAD = {
  id: "lead-123",
  displayName: "Max Mustermann",
  firstName: "Max",
  lastName: "Mustermann",
  companyName: "ACME GmbH",
  email: "max@acme.com",
  phone: "+49 123 456789",
  websiteUrl: "https://acme.de",
  score: 80,
  source: "manual" as const,
  leadStatus: "new" as const,
  owner: "Moritz",
  notes: null,
  improvements: ["SEO verbessern"],
  externalGuid: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  category: null,
  socialProfiles: [],
  activities: [],
  submissions: [],
};

const BASE_REQUEST: GenerateOutreachRequestDto = {
  leadId: "lead-123",
  promptKey: OutreachPromptKey.FirstTouch,
  channel: OutreachChannel.Linkedin,
  includeImprovements: false,
};

afterEach(() => vi.clearAllMocks());

describe("generateOutreach — lead not found", () => {
  it("returns LeadNotFound when lead does not exist", async () => {
    getLeadByIdMock.mockResolvedValue(null);
    const result = await generateOutreach(BASE_REQUEST);
    expect(result).toEqual({ ok: false, code: OutreachErrorCode.LeadNotFound });
  });

  it("does not call the AI service when the lead is not found", async () => {
    getLeadByIdMock.mockResolvedValue(null);
    await generateOutreach(BASE_REQUEST);
    expect(generateMock).not.toHaveBeenCalled();
  });
});

describe("generateOutreach — AI provider errors", () => {
  it("returns ProviderUnavailable when AI service throws PROVIDER_UNAVAILABLE", async () => {
    getLeadByIdMock.mockResolvedValue(MOCK_LEAD);
    generateMock.mockRejectedValue(new Error("PROVIDER_UNAVAILABLE"));
    const result = await generateOutreach(BASE_REQUEST);
    expect(result).toEqual({
      ok: false,
      code: OutreachErrorCode.ProviderUnavailable,
    });
  });

  it("returns Internal for unexpected AI errors", async () => {
    getLeadByIdMock.mockResolvedValue(MOCK_LEAD);
    generateMock.mockRejectedValue(new Error("network timeout"));
    const result = await generateOutreach(BASE_REQUEST);
    expect(result).toEqual({ ok: false, code: OutreachErrorCode.Internal });
  });
});

describe("generateOutreach — success (non-email channel)", () => {
  it("returns ok result without subject", async () => {
    getLeadByIdMock.mockResolvedValue(MOCK_LEAD);
    generateMock.mockResolvedValue("Generated outreach body");
    parseMock.mockReturnValue({ body: "Generated outreach body" });
    const result = await generateOutreach(BASE_REQUEST);
    expect(result).toEqual({
      ok: true,
      channel: OutreachChannel.Linkedin,
      promptKey: OutreachPromptKey.FirstTouch,
      body: "Generated outreach body",
    });
    expect(result).not.toHaveProperty("subject");
  });

  it("calls appendLeadActivity with MessageDrafted type and correct metadata", async () => {
    getLeadByIdMock.mockResolvedValue(MOCK_LEAD);
    generateMock.mockResolvedValue("Generated outreach body");
    parseMock.mockReturnValue({ body: "Generated outreach body" });
    await generateOutreach(BASE_REQUEST);
    expect(appendLeadActivityMock).toHaveBeenCalledWith({
      leadId: "lead-123",
      type: LeadActivityType.MessageDrafted,
      body: "Generated outreach body",
      metadata: {
        promptKey: OutreachPromptKey.FirstTouch,
        channel: OutreachChannel.Linkedin,
      },
      actorType: LeadActorType.System,
    });
  });

  it("does not include subject in metadata when parser returns no subject", async () => {
    getLeadByIdMock.mockResolvedValue(MOCK_LEAD);
    generateMock.mockResolvedValue("body");
    parseMock.mockReturnValue({ body: "body" });
    await generateOutreach(BASE_REQUEST);
    const callArg = appendLeadActivityMock.mock.calls[0][0] as {
      metadata: Record<string, unknown>;
    };
    expect(callArg.metadata).not.toHaveProperty("subject");
  });
});

describe("generateOutreach — success (email channel)", () => {
  const emailRequest: GenerateOutreachRequestDto = {
    ...BASE_REQUEST,
    channel: OutreachChannel.Email,
  };

  it("returns ok result with subject", async () => {
    getLeadByIdMock.mockResolvedValue(MOCK_LEAD);
    generateMock.mockResolvedValue("Betreff: Test Subject\n\nEmail body");
    parseMock.mockReturnValue({ subject: "Test Subject", body: "Email body" });
    const result = await generateOutreach(emailRequest);
    expect(result).toMatchObject({
      ok: true,
      subject: "Test Subject",
      body: "Email body",
      channel: OutreachChannel.Email,
      promptKey: OutreachPromptKey.FirstTouch,
    });
  });

  it("includes subject in appendLeadActivity metadata", async () => {
    getLeadByIdMock.mockResolvedValue(MOCK_LEAD);
    generateMock.mockResolvedValue("Betreff: Test Subject\n\nEmail body");
    parseMock.mockReturnValue({ subject: "Test Subject", body: "Email body" });
    await generateOutreach(emailRequest);
    expect(appendLeadActivityMock).toHaveBeenCalledWith({
      leadId: "lead-123",
      type: LeadActivityType.MessageDrafted,
      body: "Email body",
      metadata: {
        promptKey: OutreachPromptKey.FirstTouch,
        channel: OutreachChannel.Email,
        subject: "Test Subject",
      },
      actorType: LeadActorType.System,
    });
  });
});

describe("generateOutreach — prompt service integration", () => {
  it("calls buildPromptMessages with lead, promptKey, channel, and options", async () => {
    getLeadByIdMock.mockResolvedValue(MOCK_LEAD);
    generateMock.mockResolvedValue("body");
    parseMock.mockReturnValue({ body: "body" });
    const request: GenerateOutreachRequestDto = {
      ...BASE_REQUEST,
      includeImprovements: true,
      contextNote: "In English please",
    };
    await generateOutreach(request);
    expect(buildPromptMessagesMock).toHaveBeenCalledWith(
      MOCK_LEAD,
      OutreachPromptKey.FirstTouch,
      OutreachChannel.Linkedin,
      { includeImprovements: true, contextNote: "In English please" },
    );
  });
});
