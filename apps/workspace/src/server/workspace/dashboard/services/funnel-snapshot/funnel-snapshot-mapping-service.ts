import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import {
  FUNNEL_OUTCOME_ORDER,
  type FunnelOutcomeStatus,
} from "@/common/constants/dashboard/funnel-outcome-order";
import {
  FUNNEL_STAGE_ORDER,
  type FunnelStage,
} from "@/common/constants/dashboard/funnel-stage-order";
import type {
  FunnelSnapshotDto,
  FunnelSnapshotStageDto,
} from "@/common/contracts/dashboard/funnel-snapshot.dto";
import { aggregateCountService } from "../aggregate-count-service";

export type FunnelStatusRow = {
  lead_status: string;
  count: number | string | null;
};

type FunnelAggregation = {
  countByCurrentStage: ReadonlyMap<FunnelStage, number>;
  countByOutcome: ReadonlyMap<FunnelOutcomeStatus, number>;
  pendingReviewCount: number;
  totalCount: number;
};

const FUNNEL_STAGE_LOOKUP: ReadonlySet<string> = new Set(FUNNEL_STAGE_ORDER);
const FUNNEL_OUTCOME_LOOKUP: ReadonlySet<string> = new Set(
  FUNNEL_OUTCOME_ORDER,
);

function isFunnelStage(value: string): value is FunnelStage {
  return FUNNEL_STAGE_LOOKUP.has(value);
}

function isFunnelOutcomeStatus(value: string): value is FunnelOutcomeStatus {
  return FUNNEL_OUTCOME_LOOKUP.has(value);
}

function aggregateFunnelRows(
  rows: ReadonlyArray<FunnelStatusRow>,
): FunnelAggregation {
  const countByCurrentStage = new Map<FunnelStage, number>();
  const countByOutcome = new Map<FunnelOutcomeStatus, number>();
  let pendingReviewCount = 0;
  let totalCount = 0;

  for (const row of rows) {
    const rowCount = aggregateCountService.coerceCount(row.count);
    totalCount += rowCount;

    if (row.lead_status === ContactLeadStatus.PendingReview) {
      pendingReviewCount += rowCount;
      countByCurrentStage.set(
        ContactLeadStatus.New,
        (countByCurrentStage.get(ContactLeadStatus.New) ?? 0) + rowCount,
      );
      continue;
    }

    if (isFunnelOutcomeStatus(row.lead_status)) {
      countByOutcome.set(
        row.lead_status,
        (countByOutcome.get(row.lead_status) ?? 0) + rowCount,
      );
      continue;
    }

    if (isFunnelStage(row.lead_status)) {
      countByCurrentStage.set(
        row.lead_status,
        (countByCurrentStage.get(row.lead_status) ?? 0) + rowCount,
      );
    }
  }

  return {
    countByCurrentStage,
    countByOutcome,
    pendingReviewCount,
    totalCount,
  };
}

function getCumulativeStageCount(
  countByCurrentStage: ReadonlyMap<FunnelStage, number>,
  startIndex: number,
): number {
  return FUNNEL_STAGE_ORDER.slice(startIndex).reduce(
    (total, stage) => total + (countByCurrentStage.get(stage) ?? 0),
    0,
  );
}

function computeDropOff(
  currentCount: number,
  previousCount: number | null,
): number | null {
  if (previousCount === null) {
    return null;
  }
  if (previousCount <= 0) {
    return 0;
  }
  return Math.min(currentCount / previousCount, 1);
}

function buildStages(aggregation: FunnelAggregation): FunnelSnapshotStageDto[] {
  return FUNNEL_STAGE_ORDER.map((stage, index) => {
    const cumulativeStageCount = getCumulativeStageCount(
      aggregation.countByCurrentStage,
      index,
    );
    const previousCount =
      index === 0
        ? null
        : getCumulativeStageCount(aggregation.countByCurrentStage, index - 1);

    return {
      key: stage,
      count: cumulativeStageCount,
      dropOffFromPrev: computeDropOff(cumulativeStageCount, previousCount),
      ...(stage === ContactLeadStatus.New
        ? { pendingReviewCount: aggregation.pendingReviewCount }
        : {}),
    };
  });
}

function buildOutcomes(
  countByOutcome: ReadonlyMap<FunnelOutcomeStatus, number>,
) {
  return FUNNEL_OUTCOME_ORDER.map((key) => ({
    key,
    count: countByOutcome.get(key) ?? 0,
  }));
}

function mapRowsToSnapshotDto(
  rows: ReadonlyArray<FunnelStatusRow>,
): FunnelSnapshotDto {
  const aggregation = aggregateFunnelRows(rows);
  return {
    stages: buildStages(aggregation),
    outcomes: buildOutcomes(aggregation.countByOutcome),
    totalCount: aggregation.totalCount,
  };
}

export const funnelSnapshotMappingService = {
  mapRowsToSnapshotDto,
};
