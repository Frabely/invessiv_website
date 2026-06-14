import { describe, expect, it, vi } from "vitest";
import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import { LEAD_IMPORT_STATUS_SYNONYMS } from "@/common/constants/leads/import/status/lead-import-status-synonyms";

vi.mock("server-only", () => ({}));

describe("LEAD_IMPORT_STATUS_SYNONYMS", () => {
  it("contains lower-cased EN snake_case status labels", () => {
    expect(LEAD_IMPORT_STATUS_SYNONYMS).toEqual({
      pending_review: ContactLeadStatus.PendingReview,
      new: ContactLeadStatus.New,
      contacted: ContactLeadStatus.Contacted,
      connected: ContactLeadStatus.Connected,
      follow_up: ContactLeadStatus.FollowUp,
      not_reached: ContactLeadStatus.NotReached,
      reminder: ContactLeadStatus.Reminder,
      responded: ContactLeadStatus.Responded,
      qualified: ContactLeadStatus.Qualified,
      proposal: ContactLeadStatus.Proposal,
      on_hold: ContactLeadStatus.OnHold,
      won: ContactLeadStatus.Won,
      lost: ContactLeadStatus.Lost,
      archived: ContactLeadStatus.Archived,
    });
  });

  it("uses only lower-case lookup keys", () => {
    expect(Object.keys(LEAD_IMPORT_STATUS_SYNONYMS)).toEqual(
      Object.keys(LEAD_IMPORT_STATUS_SYNONYMS).map((key) => key.toLowerCase()),
    );
  });

  it("uses keys without spaces or hyphens", () => {
    for (const key of Object.keys(LEAD_IMPORT_STATUS_SYNONYMS)) {
      expect(key).not.toMatch(/[\s-]/);
    }
  });
});
