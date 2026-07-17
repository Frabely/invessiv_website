import { describe, expect, it } from "vitest";
import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import { funnelSnapshotMappingService } from "@/server/workspace/dashboard/services/funnel-snapshot/funnel-snapshot-mapping-service";

const { mapRowsToSnapshotDto } = funnelSnapshotMappingService;

describe("funnelSnapshotMappingService.mapRowsToSnapshotDto", () => {
  it("returns the eight funnel stages in canonical order", () => {
    const result = mapRowsToSnapshotDto([
      { lead_status: ContactLeadStatus.New, count: 1 },
    ]);

    expect(result.stages.map((stage) => stage.key)).toEqual([
      ContactLeadStatus.New,
      ContactLeadStatus.Contacted,
      ContactLeadStatus.Responded,
      ContactLeadStatus.SettingCall,
      ContactLeadStatus.ClosingCall,
      ContactLeadStatus.Qualified,
      ContactLeadStatus.Proposal,
      ContactLeadStatus.Won,
    ]);
  });

  it("computes cumulative counts so each stage includes all leads still downstream", () => {
    const result = mapRowsToSnapshotDto([
      { lead_status: ContactLeadStatus.New, count: 20 },
      { lead_status: ContactLeadStatus.Contacted, count: 12 },
      { lead_status: ContactLeadStatus.Responded, count: 6 },
      { lead_status: ContactLeadStatus.SettingCall, count: 4 },
      { lead_status: ContactLeadStatus.ClosingCall, count: 2 },
      { lead_status: ContactLeadStatus.Qualified, count: 2 },
      { lead_status: ContactLeadStatus.Proposal, count: 3 },
      { lead_status: ContactLeadStatus.Won, count: 1 },
    ]);

    expect(result.stages.map((stage) => stage.count)).toEqual([
      50, 30, 18, 12, 8, 6, 4, 1,
    ]);
  });

  it("rolls pendingReview leads into the new stage and exposes the review count", () => {
    const result = mapRowsToSnapshotDto([
      { lead_status: ContactLeadStatus.New, count: 3 },
      { lead_status: ContactLeadStatus.PendingReview, count: 30 },
      { lead_status: ContactLeadStatus.Contacted, count: 2 },
    ]);

    expect(result.stages[0]).toMatchObject({
      key: ContactLeadStatus.New,
      count: 35,
      pendingReviewCount: 30,
    });
    expect(result.totalCount).toBe(35);
  });

  it("reports outcomes in canonical order with zero-fill for missing outcomes", () => {
    const result = mapRowsToSnapshotDto([
      { lead_status: ContactLeadStatus.OnHold, count: 5 },
      { lead_status: ContactLeadStatus.Archived, count: 2 },
    ]);

    expect(result.outcomes).toEqual([
      { key: ContactLeadStatus.OnHold, count: 5 },
      { key: ContactLeadStatus.Lost, count: 0 },
      { key: ContactLeadStatus.Archived, count: 2 },
    ]);
  });

  it("returns dropOffFromPrev as null for the first stage", () => {
    const result = mapRowsToSnapshotDto([
      { lead_status: ContactLeadStatus.New, count: 10 },
    ]);

    expect(result.stages[0]?.dropOffFromPrev).toBeNull();
  });

  it("computes dropOffFromPrev as the ratio of cumulative counts", () => {
    const result = mapRowsToSnapshotDto([
      { lead_status: ContactLeadStatus.New, count: 100 },
      { lead_status: ContactLeadStatus.Contacted, count: 60 },
      { lead_status: ContactLeadStatus.Responded, count: 30 },
      { lead_status: ContactLeadStatus.SettingCall, count: 6 },
      { lead_status: ContactLeadStatus.ClosingCall, count: 3 },
      { lead_status: ContactLeadStatus.Qualified, count: 9 },
      { lead_status: ContactLeadStatus.Proposal, count: 6 },
      { lead_status: ContactLeadStatus.Won, count: 3 },
    ]);

    expect(result.stages[1]?.dropOffFromPrev).toBeCloseTo(117 / 217, 5);
    expect(result.stages[2]?.dropOffFromPrev).toBeCloseTo(57 / 117, 5);
    expect(result.stages[3]?.dropOffFromPrev).toBeCloseTo(27 / 57, 5);
    expect(result.stages[4]?.dropOffFromPrev).toBeCloseTo(21 / 27, 5);
    expect(result.stages[5]?.dropOffFromPrev).toBeCloseTo(18 / 21, 5);
  });

  it("returns 0 dropOff when the previous cumulative count is 0", () => {
    const result = mapRowsToSnapshotDto([
      { lead_status: ContactLeadStatus.New, count: 0 },
      { lead_status: ContactLeadStatus.Contacted, count: 0 },
      { lead_status: ContactLeadStatus.Responded, count: 3 },
    ]);

    expect(result.stages[3]?.dropOffFromPrev).toBe(0);
    expect(result.stages[4]?.dropOffFromPrev).toBe(0);
    expect(result.stages[5]?.dropOffFromPrev).toBe(0);
    expect(result.stages[6]?.dropOffFromPrev).toBe(0);
    expect(result.stages[7]?.dropOffFromPrev).toBe(0);
  });

  it("clamps dropOffFromPrev to 1 when later cumulative exceeds previous", () => {
    const result = mapRowsToSnapshotDto([
      { lead_status: ContactLeadStatus.New, count: 0 },
      { lead_status: ContactLeadStatus.Contacted, count: 5 },
    ]);

    expect(result.stages[1]?.dropOffFromPrev).toBe(1);
  });

  it("coerces string counts (Drizzle big-number driver edge) to numbers", () => {
    const result = mapRowsToSnapshotDto([
      {
        lead_status: ContactLeadStatus.New,
        count: "8" as unknown as number,
      },
      {
        lead_status: ContactLeadStatus.Contacted,
        count: "4" as unknown as number,
      },
    ]);

    expect(result.stages[0]?.count).toBe(12);
    expect(result.stages[1]?.count).toBe(4);
    expect(result.totalCount).toBe(12);
  });

  it("ignores rows with unknown lead_status values", () => {
    const result = mapRowsToSnapshotDto([
      { lead_status: ContactLeadStatus.New, count: 5 },
      { lead_status: "unknown_status", count: 99 },
    ]);

    expect(result.totalCount).toBe(104);
    expect(result.stages[0]?.count).toBe(5);
    expect(result.outcomes.every((outcome) => outcome.count === 0)).toBe(true);
  });
});
