import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { PitchAudience } from "@invessiv/common/constants/leads/outreach/lead-pitch-audiences";
import { PitchChannel } from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";
import { LeadPitchErrorCode } from "@invessiv/common/constants/leads/outreach/lead-pitch-error-codes";
import { ProfileSnapshotSource } from "@invessiv/common/constants/leads/outreach/profile-snapshot-sources";
import { GET, POST } from "@/app/api/workspace/outreach/pitch/route";

vi.mock("server-only", () => ({}));

const { mockAuth, mockCurrentUser, mockGeneratePitch, mockGetLatestPitch } =
  vi.hoisted(() => ({
    mockAuth: vi.fn(),
    mockCurrentUser: vi.fn(),
    mockGeneratePitch: vi.fn(),
    mockGetLatestPitch: vi.fn(),
  }));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
  currentUser: mockCurrentUser,
}));

vi.mock(
  "@/server/workspace/outreach/command-handler/generate-lead-pitch.command-handler",
  () => ({ generateLeadPitch: mockGeneratePitch }),
);

vi.mock(
  "@/server/workspace/outreach/query-handler/get-latest-lead-pitch.query-handler",
  () => ({ getLatestLeadPitch: mockGetLatestPitch }),
);

const ALLOWED_EMAIL = "owner@example.com";
const LEAD_ID = "lead-uuid-123";

const SNAPSHOT = {
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
      caption: "Die Frist für die Grundsteuererklärung rückt näher.",
      postedAt: "2026-07-01T00:00:00.000Z",
      likeCount: 24,
    },
  ],
  capturedAt: "2026-07-26T09:30:00.000Z",
};

function makePostRequest(body: unknown): NextRequest {
  return new Request("http://localhost/api/workspace/outreach/pitch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function makeGetRequest(query: string): NextRequest {
  return new Request(
    `http://localhost/api/workspace/outreach/pitch${query}`,
  ) as unknown as NextRequest;
}

function setupAuthenticatedUser(): void {
  mockAuth.mockResolvedValue({ userId: "user_123" });
  mockCurrentUser.mockResolvedValue({
    primaryEmailAddressId: "email_primary",
    emailAddresses: [{ id: "email_primary", emailAddress: ALLOWED_EMAIL }],
  });
}

beforeEach(() => {
  vi.stubEnv("WORKSPACE_ALLOWED_EMAILS", ALLOWED_EMAIL);
  mockAuth.mockReset();
  mockCurrentUser.mockReset();
  mockGeneratePitch.mockReset();
  mockGetLatestPitch.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/workspace/outreach/pitch", () => {
  it("returns 401 when the request is unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await POST(
      makePostRequest({
        leadId: LEAD_ID,
        channel: PitchChannel.Instagram,
        snapshot: SNAPSHOT,
      }),
    );

    expect(response.status).toBe(HttpResponseCode.Unauthorized);
    expect(mockGeneratePitch).not.toHaveBeenCalled();
  });

  it("returns 200 with the stored draft on success", async () => {
    setupAuthenticatedUser();
    mockGeneratePitch.mockResolvedValue({
      ok: true,
      draft: {
        id: "draft-1",
        leadId: LEAD_ID,
        channel: PitchChannel.Instagram,
        audience: PitchAudience.Team,
        salutationName: "Müller-Team",
        icebreaker: "Euer Beitrag zur Grundsteuerfrist war klar.",
        body: "Hey Müller-Team, …",
        charCount: 18,
        model: "gpt-4.1-mini",
        profileSource: ProfileSnapshotSource.BridgeApi,
        profileCapturedAt: "2026-07-26T09:30:00.000Z",
        createdAt: "2026-07-26T09:31:00.000Z",
      },
    });

    const response = await POST(
      makePostRequest({
        leadId: LEAD_ID,
        channel: PitchChannel.Instagram,
        snapshot: SNAPSHOT,
      }),
    );

    expect(response.status).toBe(HttpResponseCode.Ok);
    const body = await response.json();
    expect(body).toMatchObject({ ok: true, draft: { id: "draft-1" } });
  });

  it("returns 400 for an unsupported channel", async () => {
    setupAuthenticatedUser();

    const response = await POST(
      makePostRequest({
        leadId: LEAD_ID,
        channel: "email",
        snapshot: SNAPSHOT,
      }),
    );

    expect(response.status).toBe(HttpResponseCode.BadRequest);
    const body = await response.json();
    expect(body).toMatchObject({ error: LeadPitchErrorCode.ValidationError });
    expect(mockGeneratePitch).not.toHaveBeenCalled();
  });

  it("returns 400 when the snapshot is missing", async () => {
    setupAuthenticatedUser();

    const response = await POST(
      makePostRequest({ leadId: LEAD_ID, channel: PitchChannel.Instagram }),
    );

    expect(response.status).toBe(HttpResponseCode.BadRequest);
    expect(mockGeneratePitch).not.toHaveBeenCalled();
  });

  it("returns 400 when the snapshot platform differs from the channel", async () => {
    setupAuthenticatedUser();

    const response = await POST(
      makePostRequest({
        leadId: LEAD_ID,
        channel: PitchChannel.Linkedin,
        snapshot: SNAPSHOT,
      }),
    );

    expect(response.status).toBe(HttpResponseCode.BadRequest);
    expect(mockGeneratePitch).not.toHaveBeenCalled();
  });

  it("maps NO_PROFILE_DATA to 422", async () => {
    setupAuthenticatedUser();
    mockGeneratePitch.mockResolvedValue({
      ok: false,
      code: LeadPitchErrorCode.NoProfileData,
    });

    const response = await POST(
      makePostRequest({
        leadId: LEAD_ID,
        channel: PitchChannel.Instagram,
        snapshot: SNAPSHOT,
      }),
    );

    expect(response.status).toBe(HttpResponseCode.UnprocessableContent);
  });

  it("maps PROVIDER_UNAVAILABLE to 503", async () => {
    setupAuthenticatedUser();
    mockGeneratePitch.mockResolvedValue({
      ok: false,
      code: LeadPitchErrorCode.ProviderUnavailable,
    });

    const response = await POST(
      makePostRequest({
        leadId: LEAD_ID,
        channel: PitchChannel.Instagram,
        snapshot: SNAPSHOT,
      }),
    );

    expect(response.status).toBe(HttpResponseCode.ServiceUnavailable);
  });

  it("maps provider rate limits to 429", async () => {
    setupAuthenticatedUser();
    mockGeneratePitch.mockResolvedValue({
      ok: false,
      code: LeadPitchErrorCode.ProviderRateLimited,
    });

    const response = await POST(
      makePostRequest({
        leadId: LEAD_ID,
        channel: PitchChannel.Instagram,
        snapshot: SNAPSHOT,
      }),
    );

    expect(response.status).toBe(HttpResponseCode.TooManyRequests);
  });

  it("preserves TEMPLATE_INVALID when template loading throws", async () => {
    setupAuthenticatedUser();
    mockGeneratePitch.mockRejectedValue(
      new Error(LeadPitchErrorCode.TemplateInvalid),
    );

    const response = await POST(
      makePostRequest({
        leadId: LEAD_ID,
        channel: PitchChannel.Instagram,
        snapshot: SNAPSHOT,
      }),
    );

    expect(response.status).toBe(HttpResponseCode.InternalServerError);
    await expect(response.json()).resolves.toMatchObject({
      error: LeadPitchErrorCode.TemplateInvalid,
    });
  });

  it("returns a diagnostic id for an unexpected server failure", async () => {
    setupAuthenticatedUser();
    mockGeneratePitch.mockRejectedValue(new Error("database failed"));

    const response = await POST(
      makePostRequest({
        leadId: LEAD_ID,
        channel: PitchChannel.Instagram,
        snapshot: SNAPSHOT,
      }),
    );

    expect(response.status).toBe(HttpResponseCode.InternalServerError);
    await expect(response.json()).resolves.toMatchObject({
      error: LeadPitchErrorCode.Internal,
      errorId: expect.any(String),
    });
  });
});

describe("GET /api/workspace/outreach/pitch", () => {
  it("returns the latest draft for the requested channel", async () => {
    setupAuthenticatedUser();
    mockGetLatestPitch.mockResolvedValue(null);

    const response = await GET(
      makeGetRequest(`?leadId=${LEAD_ID}&channel=${PitchChannel.Linkedin}`),
    );

    expect(response.status).toBe(HttpResponseCode.Ok);
    expect(mockGetLatestPitch).toHaveBeenCalledWith(
      LEAD_ID,
      PitchChannel.Linkedin,
    );
    const body = await response.json();
    expect(body).toEqual({ ok: true, draft: null });
  });

  it("returns 400 without a channel", async () => {
    setupAuthenticatedUser();

    const response = await GET(makeGetRequest(`?leadId=${LEAD_ID}`));

    expect(response.status).toBe(HttpResponseCode.BadRequest);
    expect(mockGetLatestPitch).not.toHaveBeenCalled();
  });
});
