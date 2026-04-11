import type { SaveProjectRequestDto } from "@/common/contracts/contact/project-request/save-project-request-dto";
import type { TimestampedRecord } from "@/common/contracts/contact/records/timestamped-record";

export type ProjectRequestRecord = TimestampedRecord & {
  offerKey: SaveProjectRequestDto["offerKey"];
  budgetKey?: SaveProjectRequestDto["budgetKey"];
  company?: string;
  customPageNames?: string[];
  goalKey?: SaveProjectRequestDto["goalKey"];
  id: string;
  leadSubmissionId: string;
  pageKeys?: SaveProjectRequestDto["pageKeys"];
  phone?: string;
  preferredStartKey?: SaveProjectRequestDto["preferredStartKey"];
  projectDetails: string;
  role?: string;
  website?: string;
  workflowKey?: SaveProjectRequestDto["workflowKey"];
};
