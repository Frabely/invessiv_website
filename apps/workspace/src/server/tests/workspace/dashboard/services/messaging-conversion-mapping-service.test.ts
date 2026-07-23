import { describe, expect, it } from "vitest";
import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import type { MessagingConversionStatusRow } from "@/common/contracts/dashboard/messaging-conversion-status-row";
import { messagingConversionMappingService } from "@/server/workspace/dashboard/services/messaging-conversion/messaging-conversion-mapping-service";

const { mapRowsToConversionDto } = messagingConversionMappingService;

function row(
  lead_status: string,
  count: MessagingConversionStatusRow["count"],
): MessagingConversionStatusRow {
  return { lead_status, count };
}

describe("messagingConversionMappingService.mapRowsToConversionDto", () => {
  it("returns cumulative messaging steps in canonical order", () => {
    const result = mapRowsToConversionDto([
      row(ContactLeadStatus.Contacted, 4),
      row(ContactLeadStatus.Responded, 3),
      row(ContactLeadStatus.SettingCall, 2),
      row(ContactLeadStatus.ClosingCall, 1),
      row(ContactLeadStatus.Won, 1),
    ]);

    expect(result.steps.map((step) => step.key)).toEqual([
      ContactLeadStatus.Contacted,
      ContactLeadStatus.Responded,
      ContactLeadStatus.SettingCall,
      ContactLeadStatus.ClosingCall,
      ContactLeadStatus.Won,
    ]);
    expect(result.steps.map((step) => step.count)).toEqual([11, 7, 4, 2, 1]);
  });

  it.each([
    ContactLeadStatus.FollowUp,
    ContactLeadStatus.Reminder,
    ContactLeadStatus.Proposal,
    ContactLeadStatus.Lost,
  ])("counts %s in contacted and responded", (status) => {
    const result = mapRowsToConversionDto([
      row(status, 10),
      row(ContactLeadStatus.Responded, 2),
    ]);

    expect(result.steps.map((step) => step.count)).toEqual([12, 12, 0, 0, 0]);
    expect(result.steps[1]?.rateFromPrev).toBe(1);
  });

  it("counts not reached in contacted only", () => {
    const result = mapRowsToConversionDto([
      row(ContactLeadStatus.NotReached, 10),
    ]);
    expect(result.steps.map((step) => step.count)).toEqual([10, 0, 0, 0, 0]);
  });

  it.each([
    ContactLeadStatus.ConnectionRequested,
    ContactLeadStatus.Connected,
    ContactLeadStatus.Qualified,
  ])("excludes %s from the messaging conversion", (status) => {
    const result = mapRowsToConversionDto([row(status, 10)]);

    expect(result.steps.map((step) => step.count)).toEqual([0, 0, 0, 0, 0]);
  });

  it("excludes leads without a known messaging stage", () => {
    const result = mapRowsToConversionDto([
      row(ContactLeadStatus.New, 8),
      row(ContactLeadStatus.PendingReview, 7),
      row(ContactLeadStatus.OnHold, 6),
      row(ContactLeadStatus.Archived, 4),
    ]);

    expect(result.steps.map((step) => step.count)).toEqual([0, 0, 0, 0, 0]);
  });

  it("maps the requested cumulative funnel example", () => {
    const result = mapRowsToConversionDto([
      row(ContactLeadStatus.Contacted, 6),
      row(ContactLeadStatus.Responded, 3),
      row(ContactLeadStatus.SettingCall, 3),
      row(ContactLeadStatus.ClosingCall, 1),
      row(ContactLeadStatus.Won, 1),
      row(ContactLeadStatus.Reminder, 1),
    ]);
    expect(result.steps.map((step) => step.count)).toEqual([15, 9, 5, 2, 1]);
  });

  it("coerces database counts and ignores invalid values", () => {
    const result = mapRowsToConversionDto([
      row(ContactLeadStatus.Contacted, "8"),
      row(ContactLeadStatus.Responded, null),
      row(ContactLeadStatus.SettingCall, "invalid"),
      row(ContactLeadStatus.Won, 2),
    ]);

    expect(result.steps.map((step) => step.count)).toEqual([10, 2, 2, 2, 2]);
  });

  it("computes step and direct span rates from the cumulative counts", () => {
    const result = mapRowsToConversionDto([
      row(ContactLeadStatus.Contacted, 12),
      row(ContactLeadStatus.Responded, 3),
      row(ContactLeadStatus.SettingCall, 2),
      row(ContactLeadStatus.ClosingCall, 1),
      row(ContactLeadStatus.Won, 2),
    ]);

    expect(result.steps.map((step) => step.rateFromPrev)).toEqual([
      null,
      8 / 20,
      5 / 8,
      3 / 5,
      2 / 3,
    ]);
    expect(result.contactedToSetting).toEqual({
      fromCount: 20,
      toCount: 5,
      rate: 5 / 20,
    });
    expect(result.contactedToClosing).toEqual({
      fromCount: 20,
      toCount: 3,
      rate: 3 / 20,
    });
    expect(result.contactedToWon).toEqual({
      fromCount: 20,
      toCount: 2,
      rate: 2 / 20,
    });
  });

  it("returns zero rates when there are no messaging leads", () => {
    const result = mapRowsToConversionDto([]);

    expect(result.steps.map((step) => step.rateFromPrev)).toEqual([
      null,
      0,
      0,
      0,
      0,
    ]);
    expect(result.contactedToSetting).toEqual({
      fromCount: 0,
      toCount: 0,
      rate: 0,
    });
    expect(result.contactedToClosing).toEqual({
      fromCount: 0,
      toCount: 0,
      rate: 0,
    });
    expect(result.contactedToWon).toEqual({
      fromCount: 0,
      toCount: 0,
      rate: 0,
    });
  });
});

describe("messagingConversionMappingService.mapRangedRowsToConversionDto", () => {
  it("combines database-aggregated event stages with legacy statuses", () => {
    const result =
      messagingConversionMappingService.mapRangedRowsToConversionDto(
        [
          { stageRank: 1, count: 2 },
          { stageRank: "2", count: "1" },
        ],
        [{ lead_status: ContactLeadStatus.NotReached, count: 1 }],
      );

    expect(result.steps.map((step) => step.count)).toEqual([4, 3, 1, 0, 0]);
  });

  it("ignores invalid database stage ranks", () => {
    const result =
      messagingConversionMappingService.mapRangedRowsToConversionDto(
        [
          { stageRank: null, count: 1 },
          { stageRank: -1, count: 1 },
          { stageRank: 5, count: 1 },
          { stageRank: "invalid", count: 1 },
        ],
        [],
      );

    expect(result.steps.map((step) => step.count)).toEqual([0, 0, 0, 0, 0]);
  });
});
