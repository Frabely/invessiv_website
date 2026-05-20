import type { BulkSkipReason } from "@invessiv/common/constants/leads/bulk/bulk-skip-reasons";

export interface BulkEditLeadsFailedLead {
  id: string;
  displayName: string;
  reason: BulkSkipReason;
}

export interface BulkEditLeadsResult {
  ok: true;
  updatedCount: number;
  failedLeads: BulkEditLeadsFailedLead[];
}
