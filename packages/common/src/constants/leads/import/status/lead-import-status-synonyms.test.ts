import { describe, expect, it, vi } from "vitest";
import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import { LEAD_IMPORT_STATUS_SYNONYMS } from "@invessiv/common/constants/leads/import/status/lead-import-status-synonyms";

vi.mock("server-only", () => ({}));

describe("LEAD_IMPORT_STATUS_SYNONYMS", () => {
  it("contains lower-cased DE and EN status labels", () => {
    expect(LEAD_IMPORT_STATUS_SYNONYMS).toEqual({
      "zu prüfen": ContactLeadStatus.PendingReview,
      "pending review": ContactLeadStatus.PendingReview,
      pending_review: ContactLeadStatus.PendingReview,
      neu: ContactLeadStatus.New,
      new: ContactLeadStatus.New,
      kontaktiert: ContactLeadStatus.Contacted,
      contacted: ContactLeadStatus.Contacted,
      qualifiziert: ContactLeadStatus.Qualified,
      qualified: ContactLeadStatus.Qualified,
      angebot: ContactLeadStatus.Proposal,
      proposal: ContactLeadStatus.Proposal,
      pausiert: ContactLeadStatus.OnHold,
      "on hold": ContactLeadStatus.OnHold,
      on_hold: ContactLeadStatus.OnHold,
      gewonnen: ContactLeadStatus.Won,
      won: ContactLeadStatus.Won,
      verloren: ContactLeadStatus.Lost,
      lost: ContactLeadStatus.Lost,
      archiviert: ContactLeadStatus.Archived,
      archived: ContactLeadStatus.Archived,
    });
  });

  it("uses only lower-case lookup keys", () => {
    expect(Object.keys(LEAD_IMPORT_STATUS_SYNONYMS)).toEqual(
      Object.keys(LEAD_IMPORT_STATUS_SYNONYMS).map((key) => key.toLowerCase()),
    );
  });
});
