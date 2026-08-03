import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LeadActivityType } from "@invessiv/common/constants/leads/activity/lead-activity-types";
import { PitchAudience } from "@invessiv/common/constants/leads/outreach/lead-pitch-audiences";
import { PitchChannel } from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";
import { LeadPitchErrorCode } from "@invessiv/common/constants/leads/outreach/lead-pitch-error-codes";
import { ProfileSnapshotSource } from "@invessiv/common/constants/leads/outreach/profile-snapshot-sources";
import type { GeneratePitchRequestDto } from "@invessiv/common/contracts/leads/outreach/generate-pitch-request.dto";
import { generateLeadPitch } from "@/server/workspace/outreach/command-handler/generate-lead-pitch.command-handler";

const {
  getLeadByIdMock,
  generateIcebreakerMock,
  createDraftMock,
  listRecentIcebreakersMock,
  createLeadActivityMock,
  getDrizzleDatabaseClientMock,
  transaction,
} = vi.hoisted(() => ({
  getLeadByIdMock: vi.fn(),
  generateIcebreakerMock: vi.fn(),
  createDraftMock: vi.fn(),
  listRecentIcebreakersMock: vi.fn(),
  createLeadActivityMock: vi.fn().mockResolvedValue(undefined),
  getDrizzleDatabaseClientMock: vi.fn(),
  transaction: {},
}));

vi.mock("server-only", () => ({}));
vi.mock(
  "@/server/workspace/leads/query-handler/get-lead-by-id.query-handler",
  () => ({ getLeadById: getLeadByIdMock }),
);
vi.mock(
  "@/server/workspace/outreach/services/pitch-icebreaker-service",
  () => ({
    pitchIcebreakerService: { generate: generateIcebreakerMock },
  }),
);
vi.mock(
  "@/server/workspace/outreach/services/lead-pitch-draft/lead-pitch-draft-service",
  () => ({
    leadPitchDraftService: {
      createDraft: createDraftMock,
      listRecentIcebreakers: listRecentIcebreakersMock,
    },
  }),
);
vi.mock("@/server/workspace/leads/services/lead-activity-service", () => ({
  leadActivityService: { createLeadActivity: createLeadActivityMock },
}));
vi.mock("@invessiv/db/core", () => ({
  getDrizzleDatabaseClient: getDrizzleDatabaseClientMock,
}));

const MOCK_LEAD = {
  id: "lead-1",
  displayName: "Kanzlei Müller & Partner",
  firstName: null,
  lastName: null,
  companyName: "Kanzlei Müller & Partner",
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
};

function makeRequest(
  overrides: Partial<GeneratePitchRequestDto> = {},
): GeneratePitchRequestDto {
  return {
    leadId: "lead-1",
    channel: PitchChannel.Instagram,
    snapshot: {
      platform: PitchChannel.Instagram,
      source: ProfileSnapshotSource.BridgeApi,
      handle: "kanzlei_mueller",
      displayName: "Kanzlei Müller & Partner",
      biography: "Digitale Buchhaltung für Handwerksbetriebe in Kassel.",
      headline: null,
      category: "Steuerberatung",
      followerCount: 812,
      isVerified: false,
      posts: [
        {
          caption:
            "Die Frist für die Grundsteuererklärung rückt näher – wir haben das Wichtigste zusammengefasst.",
          postedAt: "2026-07-01T00:00:00.000Z",
          likeCount: 24,
        },
      ],
      capturedAt: "2026-07-26T09:30:00.000Z",
    },
    ...overrides,
  };
}

beforeEach(() => {
  createLeadActivityMock.mockResolvedValue(undefined);
  getDrizzleDatabaseClientMock.mockReturnValue({
    transaction: async (callback: (tx: unknown) => unknown) =>
      callback(transaction),
  });
  getLeadByIdMock.mockResolvedValue(MOCK_LEAD);
  listRecentIcebreakersMock.mockResolvedValue([]);
  createDraftMock.mockImplementation(async (_tx, input) => ({
    id: "draft-1",
    leadId: input.leadId,
    channel: input.channel,
    audience: input.audience,
    salutationName: input.salutationName,
    icebreaker: input.icebreaker,
    body: input.body,
    charCount: input.body.length,
    model: input.model,
    profileSource: input.profileSource,
    profileCapturedAt: input.profileCapturedAt?.toISOString() ?? null,
    createdAt: "2026-07-26T09:31:00.000Z",
  }));
  process.env.OPENAI_API_KEY = "test-key";
});

afterEach(() => {
  vi.clearAllMocks();
  delete process.env.OPENAI_API_KEY;
});

describe("generateLeadPitch", () => {
  it("renders the template around the generated icebreaker and stores the draft", async () => {
    generateIcebreakerMock.mockResolvedValue({
      salutationName: "Müller-Team",
      audience: PitchAudience.Team,
      icebreaker: "Euer Beitrag zur Grundsteuerfrist war ungewöhnlich klar.",
      model: "gpt-4.1-mini",
    });

    const result = await generateLeadPitch(makeRequest());

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.draft.body).toContain("Hey Müller-Team,");
    expect(result.draft.body).toContain(
      "Euer Beitrag zur Grundsteuerfrist war ungewöhnlich klar.",
    );
    expect(result.draft.body).toContain("wie es bei euch aussieht");
    expect(result.draft.body.length).toBeLessThanOrEqual(995);
    expect(createDraftMock).toHaveBeenCalledTimes(1);
    expect(createDraftMock).toHaveBeenCalledWith(
      transaction,
      expect.objectContaining({ leadId: "lead-1" }),
    );
    expect(createLeadActivityMock).toHaveBeenCalledWith(
      transaction,
      expect.objectContaining({
        leadId: "lead-1",
        type: LeadActivityType.MessageDrafted,
        metadata: {
          draft_id: "draft-1",
          channel: PitchChannel.Instagram,
          audience: PitchAudience.Team,
        },
      }),
    );
    expect(createLeadActivityMock.mock.calls[0][1]).not.toHaveProperty("body");
  });

  it("passes previous icebreakers to the generator so a retry differs", async () => {
    listRecentIcebreakersMock.mockResolvedValue(["Alter Icebreaker"]);
    generateIcebreakerMock.mockResolvedValue({
      salutationName: "Müller-Team",
      audience: PitchAudience.Team,
      icebreaker: "Ein anderer Aspekt eures Profils.",
      model: "gpt-4.1-mini",
    });

    await generateLeadPitch(makeRequest());

    expect(generateIcebreakerMock).toHaveBeenCalledWith(
      expect.objectContaining({ usedIcebreakers: ["Alter Icebreaker"] }),
    );
  });

  it("retries with an exact budget when the first icebreaker overflows", async () => {
    generateIcebreakerMock
      .mockResolvedValueOnce({
        salutationName: "Müller-Team",
        audience: PitchAudience.Team,
        icebreaker: "x".repeat(400),
        model: "gpt-4.1-mini",
      })
      .mockResolvedValueOnce({
        salutationName: "Müller-Team",
        audience: PitchAudience.Team,
        icebreaker: "Kurz und passend.",
        model: "gpt-4.1-mini",
      });

    const result = await generateLeadPitch(makeRequest());

    expect(result.ok).toBe(true);
    expect(generateIcebreakerMock).toHaveBeenCalledTimes(2);
    expect(generateIcebreakerMock.mock.calls[1][0].usedIcebreakers).toContain(
      "x".repeat(400),
    );
  });

  it("fails with ICEBREAKER_TOO_LONG when every attempt overflows", async () => {
    generateIcebreakerMock.mockResolvedValue({
      salutationName: "Müller-Team",
      audience: PitchAudience.Team,
      icebreaker: "x".repeat(400),
      model: "gpt-4.1-mini",
    });

    const result = await generateLeadPitch(makeRequest());

    expect(result).toEqual({
      ok: false,
      code: LeadPitchErrorCode.IcebreakerTooLong,
    });
    expect(createDraftMock).not.toHaveBeenCalled();
  });

  it("fails with NO_PROFILE_DATA when the snapshot carries nothing usable", async () => {
    const request = makeRequest();
    request.snapshot.biography = null;
    request.snapshot.posts = [];

    const result = await generateLeadPitch(request);

    expect(result).toEqual({
      ok: false,
      code: LeadPitchErrorCode.NoProfileData,
    });
    expect(generateIcebreakerMock).not.toHaveBeenCalled();
  });

  it("fails with NO_PROFILE_DATA when the model returns an empty icebreaker", async () => {
    generateIcebreakerMock.mockResolvedValue({
      salutationName: "Müller-Team",
      audience: PitchAudience.Team,
      icebreaker: "",
      model: "gpt-4.1-mini",
    });

    const result = await generateLeadPitch(makeRequest());

    expect(result).toEqual({
      ok: false,
      code: LeadPitchErrorCode.NoProfileData,
    });
  });

  it("fails with LEAD_NOT_FOUND for an unknown lead", async () => {
    getLeadByIdMock.mockResolvedValue(null);

    const result = await generateLeadPitch(makeRequest());

    expect(result).toEqual({
      ok: false,
      code: LeadPitchErrorCode.LeadNotFound,
    });
  });

  it("reports NOT_CONFIGURED when no API key is present", async () => {
    delete process.env.OPENAI_API_KEY;
    generateIcebreakerMock.mockResolvedValue(null);

    const result = await generateLeadPitch(makeRequest());

    expect(result).toEqual({
      ok: false,
      code: LeadPitchErrorCode.NotConfigured,
    });
  });

  it("reports PROVIDER_UNAVAILABLE when the provider throws", async () => {
    generateIcebreakerMock.mockRejectedValue(
      new Error(LeadPitchErrorCode.ProviderUnavailable),
    );

    const result = await generateLeadPitch(makeRequest());

    expect(result).toEqual({
      ok: false,
      code: LeadPitchErrorCode.ProviderUnavailable,
    });
  });

  it("preserves a TEMPLATE_INVALID error from the generation service", async () => {
    generateIcebreakerMock.mockRejectedValue(
      new Error(LeadPitchErrorCode.TemplateInvalid),
    );

    const result = await generateLeadPitch(makeRequest());

    expect(result).toEqual({
      ok: false,
      code: LeadPitchErrorCode.TemplateInvalid,
    });
  });

  it("fails the generation when the activity cannot be stored", async () => {
    generateIcebreakerMock.mockResolvedValue({
      salutationName: "Müller-Team",
      audience: PitchAudience.Team,
      icebreaker: "Euer Beitrag zur Grundsteuerfrist war klar.",
      model: "gpt-4.1-mini",
    });
    createLeadActivityMock.mockRejectedValue(new Error("activity failed"));

    await expect(generateLeadPitch(makeRequest())).rejects.toThrow(
      "activity failed",
    );
  });
});
