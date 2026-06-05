import type { ContactLeadEmailPersistRecord } from "@invessiv/db/contracts/contact/contact-lead-email-persist-record";
import type { ContactLeadPersistRecord } from "@invessiv/db/contracts/contact/contact-lead-persist-record";
import type { ContactLeadSubmissionPersistRecord } from "@invessiv/db/contracts/contact/contact-lead-submission-persist-record";

/**
 * Persistenz-Input für die LinkedIn-Post-Zustellung (Lead-Tausch gegen
 * Name/E-Mail). Reused die Contact-Pipeline: ein Lead, eine Submission (Channel
 * `linkedin_post_delivery`, Origin `linkedin_post`, optionaler
 * `marketing_consent`) und ein `lead_email_contacts`-Detailrecord, dessen
 * Message-Feld den Themenkontext trägt.
 */
export type LinkedInPostDeliveryPersistInput = {
  lead: ContactLeadPersistRecord;
  lead_email_contact: ContactLeadEmailPersistRecord;
  lead_submission: ContactLeadSubmissionPersistRecord;
};
