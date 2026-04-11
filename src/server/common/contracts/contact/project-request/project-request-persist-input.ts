import type { PreparedLeadRecord } from "@/server/common/contracts/contact/prepared-lead-record";
import type { PreparedLeadSubmissionRecord } from "@/server/common/contracts/contact/prepared-lead-submission-record";
import type { ProjectRequestRecord } from "@/server/common/contracts/contact/project-request/project-request-record";

export type ProjectRequestPersistInput = {
  lead: PreparedLeadRecord;
  projectRequest: ProjectRequestRecord;
  submission: PreparedLeadSubmissionRecord;
};
