import type { CreateTimeEntryRequestDto } from "@invessiv/common/contracts/crm/hours/create-time-entry-request.dto";

/** Replaces the editable fields of a time entry. Its project and its author never change. */
export interface UpdateTimeEntryRequestDto extends CreateTimeEntryRequestDto {
  /** The version the editor read; a newer one on the server answers with a conflict. */
  version: number;
}
