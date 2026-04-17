import type { LeadProjectRequestRecord } from "@/server/db/records/contact/lead-project-request-record";
import type { LeadRecord } from "@/server/db/records/contact/lead-record";
import type { LeadSubmissionRecord } from "@/server/db/records/contact/lead-submission-record";

export type ProjectRequestPersistInput = {
  lead: LeadRecord;
  lead_project_request: LeadProjectRequestRecord;
  lead_submission: LeadSubmissionRecord;
};
