import { describe, expect, it } from "vitest";
import { CONTACT_LEAD_STATUS_VALUES } from "@/common/constants/contact/contact-lead-statuses";

describe("CONTACT_LEAD_STATUS_VALUES", () => {
  it("contains all 8 statuses", () => {
    expect(CONTACT_LEAD_STATUS_VALUES).toHaveLength(8);
  });

  it("positions proposal between qualified and on_hold", () => {
    const qualifiedIdx = CONTACT_LEAD_STATUS_VALUES.indexOf(
      "qualified" as never,
    );
    const proposalIdx = CONTACT_LEAD_STATUS_VALUES.indexOf("proposal" as never);
    const onHoldIdx = CONTACT_LEAD_STATUS_VALUES.indexOf("on_hold" as never);

    expect(proposalIdx).not.toBe(-1);
    expect(proposalIdx).toBeGreaterThan(qualifiedIdx);
    expect(onHoldIdx).not.toBe(-1);
  });

  it("positions on_hold between proposal and won", () => {
    const proposalIdx = CONTACT_LEAD_STATUS_VALUES.indexOf("proposal" as never);
    const onHoldIdx = CONTACT_LEAD_STATUS_VALUES.indexOf("on_hold" as never);
    const wonIdx = CONTACT_LEAD_STATUS_VALUES.indexOf("won" as never);

    expect(onHoldIdx).toBeGreaterThan(proposalIdx);
    expect(onHoldIdx).toBeLessThan(wonIdx);
  });

  it("contains every expected status value", () => {
    const expected = [
      "new",
      "contacted",
      "qualified",
      "proposal",
      "on_hold",
      "won",
      "lost",
      "archived",
    ];

    for (const status of expected) {
      expect(CONTACT_LEAD_STATUS_VALUES).toContain(status);
    }
  });
});
