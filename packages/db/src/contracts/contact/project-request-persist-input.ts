import type { ContactLeadPersistRecord } from "@invessiv/db/contracts/contact/contact-lead-persist-record";
import type { ContactLeadProjectRequestPersistRecord } from "@invessiv/db/contracts/contact/contact-lead-project-request-persist-record";
import type { ContactLeadSubmissionPersistRecord } from "@invessiv/db/contracts/contact/contact-lead-submission-persist-record";

export type ProjectRequestPersistInput = {
  lead: ContactLeadPersistRecord;
  lead_project_request: ContactLeadProjectRequestPersistRecord;
  lead_submission: ContactLeadSubmissionPersistRecord;
};
