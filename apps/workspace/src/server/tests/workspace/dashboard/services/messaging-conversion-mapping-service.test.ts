import { describe, expect, it } from "vitest";
import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import {
  FUNNEL_STAGE_ORDER,
  type FunnelStage,
} from "@/common/constants/dashboard/funnel-stage-order";
import type { FunnelSnapshotDto } from "@/common/contracts/dashboard/funnel-snapshot.dto";
import { messagingConversionMappingService } from "@/server/workspace/dashboard/services/messaging-conversion/messaging-conversion-mapping-service";

const { mapSnapshotToConversionDto } = messagingConversionMappingService;

function buildSnapshot(
  counts: Partial<Record<FunnelStage, number>>,
): FunnelSnapshotDto {
  return {
    stages: FUNNEL_STAGE_ORDER.map((key) => ({
      key,
      count: counts[key] ?? 0,
      dropOffFromPrev: null,
    })),
    outcomes: [],
    totalCount: 0,
  };
}

describe("messagingConversionMappingService.mapSnapshotToConversionDto", () => {
  it("returns the messaging steps in canonical order with snapshot counts", () => {
    const result = mapSnapshotToConversionDto(
      buildSnapshot({
        [ContactLeadStatus.New]: 40,
        [ContactLeadStatus.Contacted]: 20,
        [ContactLeadStatus.Responded]: 8,
        [ContactLeadStatus.SettingCall]: 5,
        [ContactLeadStatus.ClosingCall]: 2,
        [ContactLeadStatus.Won]: 1,
      }),
    );

    expect(result.steps.map((step) => step.key)).toEqual([
      ContactLeadStatus.Contacted,
      ContactLeadStatus.Responded,
      ContactLeadStatus.SettingCall,
      ContactLeadStatus.ClosingCall,
      ContactLeadStatus.Won,
    ]);
    expect(result.steps.map((step) => step.count)).toEqual([20, 8, 5, 2, 1]);
  });

  it("computes rateFromPrev relative to the previous step and null for the first step", () => {
    const result = mapSnapshotToConversionDto(
      buildSnapshot({
        [ContactLeadStatus.Contacted]: 20,
        [ContactLeadStatus.Responded]: 8,
        [ContactLeadStatus.SettingCall]: 5,
        [ContactLeadStatus.ClosingCall]: 2,
        [ContactLeadStatus.Won]: 1,
      }),
    );

    expect(result.steps[0]?.rateFromPrev).toBeNull();
    expect(result.steps[1]?.rateFromPrev).toBeCloseTo(8 / 20, 5);
    expect(result.steps[2]?.rateFromPrev).toBeCloseTo(5 / 8, 5);
    expect(result.steps[3]?.rateFromPrev).toBeCloseTo(2 / 5, 5);
    expect(result.steps[4]?.rateFromPrev).toBeCloseTo(1 / 2, 5);
  });

  it("returns 0 rateFromPrev when the previous step count is 0", () => {
    const result = mapSnapshotToConversionDto(
      buildSnapshot({
        [ContactLeadStatus.Contacted]: 0,
        [ContactLeadStatus.Responded]: 3,
      }),
    );

    expect(result.steps[1]?.rateFromPrev).toBe(0);
  });

  it("clamps rateFromPrev to 1 when a later step exceeds the previous", () => {
    const result = mapSnapshotToConversionDto(
      buildSnapshot({
        [ContactLeadStatus.Contacted]: 2,
        [ContactLeadStatus.Responded]: 5,
      }),
    );

    expect(result.steps[1]?.rateFromPrev).toBe(1);
  });

  it("computes the direct span rates from contacted to each call stage and won", () => {
    const result = mapSnapshotToConversionDto(
      buildSnapshot({
        [ContactLeadStatus.Contacted]: 20,
        [ContactLeadStatus.Responded]: 8,
        [ContactLeadStatus.SettingCall]: 5,
        [ContactLeadStatus.ClosingCall]: 2,
        [ContactLeadStatus.Won]: 1,
      }),
    );

    expect(result.contactedToSetting).toEqual({
      fromCount: 20,
      toCount: 5,
      rate: 5 / 20,
    });
    expect(result.contactedToClosing).toEqual({
      fromCount: 20,
      toCount: 2,
      rate: 2 / 20,
    });
    expect(result.contactedToWon).toEqual({
      fromCount: 20,
      toCount: 1,
      rate: 1 / 20,
    });
  });

  it("returns 0 span rates when no leads were contacted", () => {
    const result = mapSnapshotToConversionDto(buildSnapshot({}));

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

  it("treats stages missing from the snapshot as 0", () => {
    const result = mapSnapshotToConversionDto({
      stages: [
        {
          key: ContactLeadStatus.Contacted,
          count: 4,
          dropOffFromPrev: null,
        },
      ],
      outcomes: [],
      totalCount: 4,
    });

    expect(result.steps.map((step) => step.count)).toEqual([4, 0, 0, 0, 0]);
    expect(result.contactedToSetting).toEqual({
      fromCount: 4,
      toCount: 0,
      rate: 0,
    });
    expect(result.contactedToClosing).toEqual({
      fromCount: 4,
      toCount: 0,
      rate: 0,
    });
    expect(result.contactedToWon).toEqual({
      fromCount: 4,
      toCount: 0,
      rate: 0,
    });
  });
});
