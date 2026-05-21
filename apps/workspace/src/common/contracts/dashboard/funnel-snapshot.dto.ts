import type { FunnelOutcomeStatus } from "@/common/constants/dashboard/funnel-outcome-order";
import type { FunnelStage } from "@/common/constants/dashboard/funnel-stage-order";

export type FunnelSnapshotStageDto = {
  key: FunnelStage;
  count: number;
  dropOffFromPrev: number | null;
  pendingReviewCount?: number;
};

export type FunnelSnapshotOutcomeDto = {
  key: FunnelOutcomeStatus;
  count: number;
};

export type FunnelSnapshotDto = {
  stages: ReadonlyArray<FunnelSnapshotStageDto>;
  outcomes: ReadonlyArray<FunnelSnapshotOutcomeDto>;
  totalCount: number;
};
