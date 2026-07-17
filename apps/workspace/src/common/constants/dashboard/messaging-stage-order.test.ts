import { describe, expect, it } from "vitest";
import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import { FUNNEL_STAGE_ORDER } from "./funnel-stage-order";
import { MESSAGING_STAGE_ORDER } from "./messaging-stage-order";

describe("MESSAGING_STAGE_ORDER", () => {
  it("contains exactly the messaging conversion stages in order", () => {
    expect(MESSAGING_STAGE_ORDER).toEqual([
      ContactLeadStatus.Contacted,
      ContactLeadStatus.Responded,
      ContactLeadStatus.SettingCall,
      ContactLeadStatus.ClosingCall,
      ContactLeadStatus.Won,
    ]);
  });

  it("contains no duplicates", () => {
    expect(new Set(MESSAGING_STAGE_ORDER).size).toBe(
      MESSAGING_STAGE_ORDER.length,
    );
  });

  it("preserves the relative funnel stage order", () => {
    const funnelIndices = MESSAGING_STAGE_ORDER.map((stage) =>
      FUNNEL_STAGE_ORDER.indexOf(stage),
    );

    expect(funnelIndices.every((index) => index !== -1)).toBe(true);
    expect([...funnelIndices].sort((a, b) => a - b)).toEqual(funnelIndices);
  });
});
