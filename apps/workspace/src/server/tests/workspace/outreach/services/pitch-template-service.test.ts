import { describe, expect, it, vi } from "vitest";
import {
  PITCH_AUDIENCE_VALUES,
  PitchAudience,
} from "@invessiv/common/constants/leads/outreach/lead-pitch-audiences";
import { PITCH_CHANNEL_LIMITS } from "@invessiv/common/constants/leads/outreach/lead-pitch-channel-limits";
import {
  PITCH_CHANNEL_VALUES,
  PitchChannel,
} from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";
import { LeadPitchErrorCode } from "@invessiv/common/constants/leads/outreach/lead-pitch-error-codes";
import {
  PITCH_ICEBREAKER_TARGET_CHARS,
  PITCH_SALUTATION_NAME_RESERVE_CHARS,
} from "@invessiv/common/defaults/leads/outreach/lead-pitch-defaults";
import { pitchTemplateService } from "@/server/workspace/outreach/services/pitch-template-service";

vi.mock("server-only", () => ({}));

describe("pitchTemplateService.loadTemplate", () => {
  it("provides a template with both placeholders for every channel and audience", async () => {
    for (const channel of PITCH_CHANNEL_VALUES) {
      for (const audience of PITCH_AUDIENCE_VALUES) {
        const template = await pitchTemplateService.loadTemplate(
          channel,
          audience,
        );

        expect(template).toContain("{{Name}}");
        expect(template).toContain("{{Icebreaker}}");
      }
    }
  });

  it("uses the du form for single and the ihr form for team", async () => {
    const single = await pitchTemplateService.loadTemplate(
      PitchChannel.Instagram,
      PitchAudience.Single,
    );
    const team = await pitchTemplateService.loadTemplate(
      PitchChannel.Instagram,
      PitchAudience.Team,
    );

    expect(single).toContain("wie es bei dir aussieht");
    expect(team).toContain("wie es bei euch aussieht");
    expect(team).not.toContain("Wärst du offen");
  });

  it("rejects an unknown template with TEMPLATE_INVALID", async () => {
    await expect(
      pitchTemplateService.loadTemplate(
        "telepathy" as PitchChannel,
        PitchAudience.Single,
      ),
    ).rejects.toThrow(LeadPitchErrorCode.TemplateInvalid);
  });
});

describe("pitchTemplateService.render", () => {
  it("replaces both placeholders", async () => {
    const body = await pitchTemplateService.render({
      channel: PitchChannel.Instagram,
      audience: PitchAudience.Team,
      salutationName: "Müller-Team",
      icebreaker: "Euer Beitrag zur Grundsteuerfrist war ungewöhnlich klar.",
    });

    expect(body).toContain("Hey Müller-Team,");
    expect(body).toContain(
      "Euer Beitrag zur Grundsteuerfrist war ungewöhnlich klar.",
    );
    expect(body).not.toContain("{{");
  });

  it("keeps dollar sequences in the generated values literal", async () => {
    const body = await pitchTemplateService.render({
      channel: PitchChannel.Linkedin,
      audience: PitchAudience.Single,
      salutationName: "Jonas",
      icebreaker: "Dein Beitrag zu $-Preisen war interessant.",
    });

    expect(body).toContain("Dein Beitrag zu $-Preisen war interessant.");
  });
});

describe("pitchTemplateService.getIcebreakerBudget", () => {
  it("keeps an Instagram pitch inside the channel limit", async () => {
    const salutationName = "Müller-Team";
    const budget = await pitchTemplateService.getIcebreakerBudget({
      channel: PitchChannel.Instagram,
      audience: PitchAudience.Team,
      salutationName,
    });

    const body = await pitchTemplateService.render({
      channel: PitchChannel.Instagram,
      audience: PitchAudience.Team,
      salutationName,
      icebreaker: "x".repeat(budget),
    });

    expect(body.length).toBeLessThanOrEqual(
      PITCH_CHANNEL_LIMITS[PitchChannel.Instagram],
    );
  });

  it("keeps the reserved budget valid for a name of full reserve length", async () => {
    const budget = await pitchTemplateService.getIcebreakerBudget({
      channel: PitchChannel.Instagram,
      audience: PitchAudience.Team,
    });

    const body = await pitchTemplateService.render({
      channel: PitchChannel.Instagram,
      audience: PitchAudience.Team,
      salutationName: "A".repeat(PITCH_SALUTATION_NAME_RESERVE_CHARS),
      icebreaker: "x".repeat(budget),
    });

    expect(body.length).toBeLessThanOrEqual(
      PITCH_CHANNEL_LIMITS[PitchChannel.Instagram],
    );
    expect(budget).toBeGreaterThanOrEqual(150);
  });

  it("shrinks the budget when a long name eats into the channel limit", async () => {
    const longName = "A".repeat(60);
    const shortNameBudget = await pitchTemplateService.getIcebreakerBudget({
      channel: PitchChannel.Instagram,
      audience: PitchAudience.Team,
      salutationName: "Ab",
    });
    const longNameBudget = await pitchTemplateService.getIcebreakerBudget({
      channel: PitchChannel.Instagram,
      audience: PitchAudience.Team,
      salutationName: longName,
    });

    expect(longNameBudget).toBeLessThan(shortNameBudget);

    const body = await pitchTemplateService.render({
      channel: PitchChannel.Instagram,
      audience: PitchAudience.Team,
      salutationName: longName,
      icebreaker: "x".repeat(longNameBudget),
    });

    expect(body.length).toBeLessThanOrEqual(
      PITCH_CHANNEL_LIMITS[PitchChannel.Instagram],
    );
  });

  it("never exceeds the target length even when the channel allows more", async () => {
    const budget = await pitchTemplateService.getIcebreakerBudget({
      channel: PitchChannel.Linkedin,
      audience: PitchAudience.Single,
      salutationName: "Jonas",
    });

    expect(budget).toBe(PITCH_ICEBREAKER_TARGET_CHARS);
  });
});
