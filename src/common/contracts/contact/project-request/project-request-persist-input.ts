import type { PreparedLeadRecord } from "@/common/contracts/contact/records/prepared-lead-record";
import type { PreparedLeadSubmissionRecord } from "@/common/contracts/contact/records/prepared-lead-submission-record";
import type { ProjectRequestRecord } from "@/common/contracts/contact/project-request/project-request-record";

export type ProjectRequestPersistInput = {
  lead: PreparedLeadRecord;
  projectRequest: ProjectRequestRecord;
  submission: PreparedLeadSubmissionRecord;
};
