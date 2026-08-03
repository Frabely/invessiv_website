import { describe, expect, it, vi } from "vitest";
import { PitchAudience } from "@invessiv/common/constants/leads/outreach/lead-pitch-audiences";
import { PitchChannel } from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";
import { ProfileSnapshotSource } from "@invessiv/common/constants/leads/outreach/profile-snapshot-sources";
import { mapLeadPitchDraftRowToDto } from "@/server/workspace/outreach/services/lead-pitch-draft/lead-pitch-draft-mapping-service";

vi.mock("server-only", () => ({}));

const ROW = {
  id: "draft-1",
  lead_id: "lead-1",
  channel: PitchChannel.Instagram,
  audience: PitchAudience.Team,
  salutation_name: "Müller-Team",
  icebreaker: "Euer Beitrag zur Grundsteuerfrist war ungewöhnlich klar.",
  body: "Hey Müller-Team, …",
  char_count: 18,
  model: "gpt-4.1-mini",
  profile_source: ProfileSnapshotSource.BridgeApi,
  profile_captured_at: new Date("2026-07-26T09:30:00.000Z"),
  created_at: new Date("2026-07-26T09:31:00.000Z"),
};

describe("mapLeadPitchDraftRowToDto", () => {
  it("maps every snake_case column to its camelCase field", () => {
    expect(mapLeadPitchDraftRowToDto(ROW)).toEqual({
      id: "draft-1",
      leadId: "lead-1",
      channel: PitchChannel.Instagram,
      audience: PitchAudience.Team,
      salutationName: "Müller-Team",
      icebreaker: "Euer Beitrag zur Grundsteuerfrist war ungewöhnlich klar.",
      body: "Hey Müller-Team, …",
      charCount: 18,
      model: "gpt-4.1-mini",
      profileSource: ProfileSnapshotSource.BridgeApi,
      profileCapturedAt: "2026-07-26T09:30:00.000Z",
      createdAt: "2026-07-26T09:31:00.000Z",
    });
  });

  it("keeps nullable columns null", () => {
    const dto = mapLeadPitchDraftRowToDto({
      ...ROW,
      model: null,
      profile_captured_at: null,
    });

    expect(dto.model).toBeNull();
    expect(dto.profileCapturedAt).toBeNull();
  });

  it("serialises timestamps as ISO strings", () => {
    const dto = mapLeadPitchDraftRowToDto(ROW);

    expect(typeof dto.createdAt).toBe("string");
    expect(typeof dto.profileCapturedAt).toBe("string");
  });
});
