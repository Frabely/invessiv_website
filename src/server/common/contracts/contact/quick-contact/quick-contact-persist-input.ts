import type { PreparedLeadRecord } from "@/server/common/contracts/contact/prepared-lead-record";
import type { PreparedLeadSubmissionRecord } from "@/server/common/contracts/contact/prepared-lead-submission-record";
import type { EmailContactRecord } from "@/server/common/contracts/contact/quick-contact/email-contact-record";

export type QuickContactPersistInput = {
  emailContact: EmailContactRecord;
  lead: PreparedLeadRecord;
  submission: PreparedLeadSubmissionRecord;
};
