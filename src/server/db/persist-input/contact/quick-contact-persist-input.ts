import type { EmailContactRecord } from "@/server/db/records/contact/email-contact-record";
import type { PreparedLeadRecord } from "@/server/db/records/contact/prepared-lead-record";
import type { PreparedLeadSubmissionRecord } from "@/server/db/records/contact/prepared-lead-submission-record";

export type QuickContactPersistInput = {
  emailContact: EmailContactRecord;
  lead: PreparedLeadRecord;
  submission: PreparedLeadSubmissionRecord;
};
