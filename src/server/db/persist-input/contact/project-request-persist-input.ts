import type { PreparedLeadRecord } from "@/server/db/records/contact/prepared-lead-record";
import type { PreparedLeadSubmissionRecord } from "@/server/db/records/contact/prepared-lead-submission-record";
import type { ProjectRequestRecord } from "@/server/db/records/contact/project-request-record";

export type ProjectRequestPersistInput = {
  lead: PreparedLeadRecord;
  projectRequest: ProjectRequestRecord;
  submission: PreparedLeadSubmissionRecord;
};
