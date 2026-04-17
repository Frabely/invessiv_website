import type { LeadEmailContactRecord } from "@/server/db/records/contact/lead-email-contact-record";
import type { LeadRecord } from "@/server/db/records/contact/lead-record";
import type { LeadSubmissionRecord } from "@/server/db/records/contact/lead-submission-record";

export type QuickContactPersistInput = {
  lead: LeadRecord;
  lead_email_contact: LeadEmailContactRecord;
  lead_submission: LeadSubmissionRecord;
};
