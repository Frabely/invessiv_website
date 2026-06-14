import { describe, expect, it } from "vitest";
import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import { FUNNEL_OUTCOME_ORDER } from "./funnel-outcome-order";
import { FUNNEL_STAGE_ORDER } from "./funnel-stage-order";

const OUTREACH_STATES = [
  ContactLeadStatus.Connected,
  ContactLeadStatus.FollowUp,
  ContactLeadStatus.NotReached,
  ContactLeadStatus.Reminder,
] as const;

describe("dashboard funnel order", () => {
  it("excludes the outreach states from the funnel stages", () => {
    for (const status of OUTREACH_STATES) {
      expect(FUNNEL_STAGE_ORDER).not.toContain(status);
    }
  });

  it("excludes the outreach states from the funnel outcomes", () => {
    for (const status of OUTREACH_STATES) {
      expect(FUNNEL_OUTCOME_ORDER).not.toContain(status);
    }
  });
});
