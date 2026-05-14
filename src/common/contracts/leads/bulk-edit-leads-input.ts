import type { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";

export interface BulkEditLeadsPatch {
  status?: ContactLeadStatus;
  categoryId?: string | null;
  score?: number | null;
  owner?: string | null;
  notesAppend?: string;
  improvementsAppend?: string[];
}

export interface BulkEditLeadsInput {
  ids: string[];
  patch: BulkEditLeadsPatch;
}
