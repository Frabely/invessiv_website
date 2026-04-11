import type { PreparedLeadRecord } from "@/common/contracts/contact/records/prepared-lead-record";
import type { PreparedLeadSubmissionRecord } from "@/common/contracts/contact/records/prepared-lead-submission-record";
import type { EmailContactRecord } from "@/common/contracts/contact/quick-contact/email-contact-record";

export type QuickContactPersistInput = {
  emailContact: EmailContactRecord;
  lead: PreparedLeadRecord;
  submission: PreparedLeadSubmissionRecord;
};
