import "server-only";
import { between, count } from "drizzle-orm";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { leads } from "@invessiv/db/record-configuration";
import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import {
  FUNNEL_STAGE_ORDER,
  type FunnelStage,
} from "@/common/constants/dashboard/funnel-stage-order";
import type {
  FunnelSnapshotDto,
  FunnelSnapshotStageDto,
} from "@/common/contracts/dashboard/funnel-snapshot.dto";
import type { GetFunnelSnapshotInput } from "@/common/contracts/dashboard/get-funnel-snapshot-input";

type FunnelStatusRow = {
  lead_status: string;
  count: number | string | null;
};

const FUNNEL_OUTCOME_ORDER = [
  ContactLeadStatus.OnHold,
  ContactLeadStatus.Lost,
  ContactLeadStatus.Archived,
] as const;

type FunnelOutcomeStatus = (typeof FUNNEL_OUTCOME_ORDER)[number];

function toCount(raw: number | string | null | undefined): number {
  if (raw === null || raw === undefined) {
    return 0;
  }
  return typeof raw === "number" ? raw : Number(raw);
}

function isFunnelStage(value: string): value is FunnelStage {
  return (FUNNEL_STAGE_ORDER as ReadonlyArray<string>).includes(value);
}

function isFunnelOutcomeStatus(value: string): value is FunnelOutcomeStatus {
  return (FUNNEL_OUTCOME_ORDER as ReadonlyArray<string>).includes(value);
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

export async function getFunnelSnapshot(
  input: GetFunnelSnapshotInput,
): Promise<FunnelSnapshotDto> {
  const db = getDrizzleDatabaseClient();

  const rows = (await db
    .select({
      lead_status: leads.lead_status,
      count: count(),
    })
    .from(leads)
    .where(between(leads.created_at, input.from, input.to))
    .groupBy(leads.lead_status)) as ReadonlyArray<FunnelStatusRow>;

  const countByCurrentStage = new Map<FunnelStage, number>();
  const countByOutcome = new Map<FunnelOutcomeStatus, number>();
  let pendingReviewCount = 0;
  let totalCount = 0;
  for (const row of rows) {
    const rowCount = toCount(row.count);
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

  const stages: FunnelSnapshotStageDto[] = FUNNEL_STAGE_ORDER.map(
    (stage, index) => {
      const cumulativeStageCount = getCumulativeStageCount(
        countByCurrentStage,
        index,
      );
      const previousCount =
        index === 0
          ? null
          : getCumulativeStageCount(countByCurrentStage, index - 1);

      return {
        key: stage,
        count: cumulativeStageCount,
        dropOffFromPrev:
          previousCount === null
            ? null
            : previousCount <= 0
              ? 0
              : Math.min(cumulativeStageCount / previousCount, 1),
        ...(stage === ContactLeadStatus.New ? { pendingReviewCount } : {}),
      };
    },
  );

  return {
    stages,
    outcomes: FUNNEL_OUTCOME_ORDER.map((key) => ({
      key,
      count: countByOutcome.get(key) ?? 0,
    })),
    totalCount,
  };
}
