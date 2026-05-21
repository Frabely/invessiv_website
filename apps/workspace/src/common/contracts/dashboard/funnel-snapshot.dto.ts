import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import type { FunnelStage } from "@/common/constants/dashboard/funnel-stage-order";

export type FunnelSnapshotStageDto = {
  key: FunnelStage;
  count: number;
  dropOffFromPrev: number | null;
  pendingReviewCount?: number;
};

export type FunnelSnapshotOutcomeDto = {
  key:
    | typeof ContactLeadStatus.OnHold
    | typeof ContactLeadStatus.Lost
    | typeof ContactLeadStatus.Archived;
  count: number;
};

export type FunnelSnapshotDto = {
  stages: ReadonlyArray<FunnelSnapshotStageDto>;
  outcomes: ReadonlyArray<FunnelSnapshotOutcomeDto>;
  totalCount: number;
};
