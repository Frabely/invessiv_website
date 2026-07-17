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

  it("positions the call stages between responded and qualified", () => {
    const respondedIdx = FUNNEL_STAGE_ORDER.indexOf(
      ContactLeadStatus.Responded,
    );
    const settingCallIdx = FUNNEL_STAGE_ORDER.indexOf(
      ContactLeadStatus.SettingCall,
    );
    const closingCallIdx = FUNNEL_STAGE_ORDER.indexOf(
      ContactLeadStatus.ClosingCall,
    );
    const qualifiedIdx = FUNNEL_STAGE_ORDER.indexOf(
      ContactLeadStatus.Qualified,
    );

    expect(settingCallIdx).toBeGreaterThan(respondedIdx);
    expect(closingCallIdx).toBeGreaterThan(settingCallIdx);
    expect(closingCallIdx).toBeLessThan(qualifiedIdx);
  });

  it("excludes the outreach states from the funnel outcomes", () => {
    for (const status of OUTREACH_STATES) {
      expect(FUNNEL_OUTCOME_ORDER).not.toContain(status);
    }
  });
});
