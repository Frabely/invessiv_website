import type { ProjectRequestSubmitInput } from "@/features/contact/contact.schema";
import type { TimestampedRecord } from "@/server/common/contracts/contact/timestamped-record";

export type ProjectRequestRecord = TimestampedRecord & {
  offerKey: ProjectRequestSubmitInput["offerKey"];
  budgetKey?: ProjectRequestSubmitInput["budgetKey"];
  company?: string;
  customPageNames?: string[];
  goalKey?: ProjectRequestSubmitInput["goalKey"];
  id: string;
  leadSubmissionId: string;
  pageKeys?: ProjectRequestSubmitInput["pageKeys"];
  phone?: string;
  preferredStartKey?: ProjectRequestSubmitInput["preferredStartKey"];
  projectDetails: string;
  role?: string;
  website?: string;
  workflowKey?: ProjectRequestSubmitInput["workflowKey"];
};
