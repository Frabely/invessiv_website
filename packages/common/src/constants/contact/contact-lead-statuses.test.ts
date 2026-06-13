import { describe, expect, it } from "vitest";
import {
  CONTACT_LEAD_STATUS_ALL,
  CONTACT_LEAD_STATUS_VALUES,
} from "@invessiv/common/constants/contact/contact-lead-statuses";

describe("CONTACT_LEAD_STATUS_VALUES", () => {
  it("contains all 14 statuses", () => {
    expect(CONTACT_LEAD_STATUS_VALUES).toHaveLength(14);
  });

  it("positions pending_review between new and contacted", () => {
    const newIdx = CONTACT_LEAD_STATUS_VALUES.indexOf("new" as never);
    const pendingReviewIdx = CONTACT_LEAD_STATUS_VALUES.indexOf(
      "pending_review" as never,
    );
    const contactedIdx = CONTACT_LEAD_STATUS_VALUES.indexOf(
      "contacted" as never,
    );

    expect(pendingReviewIdx).toBeGreaterThan(newIdx);
    expect(pendingReviewIdx).toBeLessThan(contactedIdx);
  });

  it("positions responded between contacted and qualified", () => {
    const contactedIdx = CONTACT_LEAD_STATUS_VALUES.indexOf(
      "contacted" as never,
    );
    const respondedIdx = CONTACT_LEAD_STATUS_VALUES.indexOf(
      "responded" as never,
    );
    const qualifiedIdx = CONTACT_LEAD_STATUS_VALUES.indexOf(
      "qualified" as never,
    );

    expect(respondedIdx).not.toBe(-1);
    expect(respondedIdx).toBeGreaterThan(contactedIdx);
    expect(respondedIdx).toBeLessThan(qualifiedIdx);
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

  it("positions the outreach states between contacted and responded", () => {
    const contactedIdx = CONTACT_LEAD_STATUS_VALUES.indexOf(
      "contacted" as never,
    );
    const respondedIdx = CONTACT_LEAD_STATUS_VALUES.indexOf(
      "responded" as never,
    );

    for (const status of [
      "connected",
      "follow_up",
      "not_reached",
      "reminder",
    ]) {
      const idx = CONTACT_LEAD_STATUS_VALUES.indexOf(status as never);
      expect(idx).toBeGreaterThan(contactedIdx);
      expect(idx).toBeLessThan(respondedIdx);
    }
  });

  it("contains every expected status value", () => {
    const expected = [
      "new",
      "pending_review",
      "contacted",
      "connected",
      "follow_up",
      "not_reached",
      "reminder",
      "responded",
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

describe("CONTACT_LEAD_STATUS_ALL", () => {
  it("exposes the all filter value", () => {
    expect(CONTACT_LEAD_STATUS_ALL).toBe("all");
  });
});
