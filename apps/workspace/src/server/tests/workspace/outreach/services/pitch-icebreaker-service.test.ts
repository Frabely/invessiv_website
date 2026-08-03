import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PitchChannel } from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";
import { LeadPitchErrorCode } from "@invessiv/common/constants/leads/outreach/lead-pitch-error-codes";
import { ProfileSnapshotSource } from "@invessiv/common/constants/leads/outreach/profile-snapshot-sources";
import type { PitchIcebreakerInput } from "@/server/workspace/outreach/pitch-icebreaker-types";
import { pitchIcebreakerService } from "@/server/workspace/outreach/services/pitch-icebreaker-service";

const { createCompletionMock } = vi.hoisted(() => ({
  createCompletionMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("openai", () => ({
  default: class OpenAiMock {
    chat = {
      completions: {
        create: createCompletionMock,
      },
    };
  },
}));

const INPUT: PitchIcebreakerInput = {
  lead: {
    id: "lead-1",
    displayName: "Kanzlei Beispiel",
    firstName: null,
    lastName: null,
    companyName: "Kanzlei Beispiel",
    email: null,
    phone: null,
    websiteUrl: null,
    score: null,
    source: "manual" as const,
    leadStatus: "new" as const,
    owner: null,
    notes: null,
    improvements: null,
    externalGuid: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    category: null,
    socialProfiles: [],
    activities: [],
    submissions: [],
  },
  channel: PitchChannel.Instagram,
  snapshot: {
    platform: PitchChannel.Instagram,
    source: ProfileSnapshotSource.BridgeApi,
    handle: "kanzlei",
    displayName: "Kanzlei Beispiel",
    biography: "Digitale Steuerberatung für Handwerksbetriebe.",
    headline: null,
    category: "Steuerberatung",
    followerCount: 100,
    isVerified: false,
    posts: [],
    capturedAt: "2026-07-26T10:00:00.000Z",
  },
  icebreakerBudget: 195,
  usedIcebreakers: [],
};

function providerError(status: number, code: string): unknown {
  return Object.assign(new Error("Provider request failed"), { status, code });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("OPENAI_API_KEY", "test-key");
  vi.stubEnv("OPENAI_MODEL", "gpt-4.1-mini");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("pitchIcebreakerService.generate", () => {
  it("parses a structured provider response", async () => {
    createCompletionMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              salutationName: "Beispiel-Team",
              audience: "team",
              icebreaker:
                "Euer Fokus auf Handwerksbetriebe ist klar erkennbar.",
            }),
          },
        },
      ],
    });

    await expect(pitchIcebreakerService.generate(INPUT)).resolves.toEqual({
      salutationName: "Beispiel-Team",
      audience: "team",
      icebreaker: "Euer Fokus auf Handwerksbetriebe ist klar erkennbar.",
      model: "gpt-4.1-mini",
    });
  });

  it.each([
    [401, "invalid_api_key", LeadPitchErrorCode.AuthenticationFailed],
    [404, "model_not_found", LeadPitchErrorCode.ModelUnavailable],
    [429, "rate_limit_exceeded", LeadPitchErrorCode.ProviderRateLimited],
    [400, "invalid_request_error", LeadPitchErrorCode.ProviderRejected],
    [503, "server_error", LeadPitchErrorCode.ProviderUnavailable],
  ])(
    "maps provider status %s to %s",
    async (status, providerCode, expectedCode) => {
      createCompletionMock.mockRejectedValue(
        providerError(status, providerCode),
      );

      await expect(pitchIcebreakerService.generate(INPUT)).rejects.toThrow(
        expectedCode,
      );
    },
  );

  it("reports malformed structured output separately", async () => {
    createCompletionMock.mockResolvedValue({
      choices: [{ message: { content: "not-json" } }],
    });

    await expect(pitchIcebreakerService.generate(INPUT)).rejects.toThrow(
      LeadPitchErrorCode.ProviderInvalidResponse,
    );
  });
});
