import type { ProjectRequestSubmitRequest } from "@/common/contracts/contact/submit/contact-submit";
import type { TimestampedRecord } from "@/common/contracts/contact/records/timestamped-record";

export type ProjectRequestRecord = TimestampedRecord & {
  offerKey: ProjectRequestSubmitRequest["offerKey"];
  budgetKey?: ProjectRequestSubmitRequest["budgetKey"];
  company?: string;
  customPageNames?: string[];
  goalKey?: ProjectRequestSubmitRequest["goalKey"];
  id: string;
  leadSubmissionId: string;
  pageKeys?: ProjectRequestSubmitRequest["pageKeys"];
  phone?: string;
  preferredStartKey?: ProjectRequestSubmitRequest["preferredStartKey"];
  projectDetails: string;
  role?: string;
  website?: string;
  workflowKey?: ProjectRequestSubmitRequest["workflowKey"];
};
