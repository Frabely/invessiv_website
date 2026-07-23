import {
  CONTACT_LEAD_STATUS_VALUES,
  ContactLeadStatus,
  type ContactLeadStatus as ContactLeadStatusType,
} from "@invessiv/common/constants/contact/contact-lead-statuses";
import {
  MESSAGING_STAGE_ORDER,
  type MessagingStage,
} from "@/common/constants/dashboard/messaging-stage-order";
import type { MessagingConversionDto } from "@/common/contracts/dashboard/messaging-conversion.dto";
import type { MessagingConversionSpanRateDto } from "@/common/contracts/dashboard/messaging-conversion-span-rate.dto";
import type { MessagingConversionStageRankRow } from "@/common/contracts/dashboard/messaging-conversion-stage-rank-row";
import type { MessagingConversionStatusRow } from "@/common/contracts/dashboard/messaging-conversion-status-row";
import type { MessagingConversionStepDto } from "@/common/contracts/dashboard/messaging-conversion-step.dto";
import { aggregateCountService } from "../aggregate-count-service";

const CONTACTED_OUTREACH_STATUSES: ReadonlySet<ContactLeadStatusType> = new Set(
  [ContactLeadStatus.Contacted, ContactLeadStatus.NotReached],
);

const RESPONDED_OUTREACH_STATUSES: ReadonlySet<ContactLeadStatusType> = new Set(
  [
    ContactLeadStatus.Responded,
    ContactLeadStatus.FollowUp,
    ContactLeadStatus.Reminder,
    ContactLeadStatus.Proposal,
    ContactLeadStatus.Lost,
  ],
);

const CONTACT_LEAD_STATUSES: ReadonlySet<string> = new Set(
  CONTACT_LEAD_STATUS_VALUES,
);

function isContactLeadStatus(status: string): status is ContactLeadStatusType {
  return CONTACT_LEAD_STATUSES.has(status);
}

function getMessagingStageForStatus(
  status: ContactLeadStatusType,
): MessagingStage | null {
  if (CONTACTED_OUTREACH_STATUSES.has(status)) {
    return ContactLeadStatus.Contacted;
  }

  if (RESPONDED_OUTREACH_STATUSES.has(status)) {
    return ContactLeadStatus.Responded;
  }

  switch (status) {
    case ContactLeadStatus.SettingCall:
      return ContactLeadStatus.SettingCall;
    case ContactLeadStatus.ClosingCall:
      return ContactLeadStatus.ClosingCall;
    case ContactLeadStatus.Won:
      return ContactLeadStatus.Won;
    default:
      return null;
  }
}

function computeRateFromPrev(
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

function computeSpanRate(
  fromCount: number,
  toCount: number,
): MessagingConversionSpanRateDto {
  return {
    fromCount,
    toCount,
    rate: fromCount <= 0 ? 0 : Math.min(toCount / fromCount, 1),
  };
}

function aggregateCurrentStageCounts(
  rows: ReadonlyArray<MessagingConversionStatusRow>,
): ReadonlyMap<MessagingStage, number> {
  const countByCurrentStage = new Map<MessagingStage, number>();

  for (const row of rows) {
    if (!isContactLeadStatus(row.lead_status)) {
      continue;
    }
    const stage = getMessagingStageForStatus(row.lead_status);
    if (stage === null) {
      continue;
    }
    const coercedCount = aggregateCountService.coerceCount(row.count);
    const rowCount = Number.isFinite(coercedCount)
      ? Math.max(coercedCount, 0)
      : 0;

    countByCurrentStage.set(
      stage,
      (countByCurrentStage.get(stage) ?? 0) + rowCount,
    );
  }

  return countByCurrentStage;
}

function mapRangedRowsToConversionDto(
  eventRows: ReadonlyArray<MessagingConversionStageRankRow>,
  legacyRows: ReadonlyArray<MessagingConversionStatusRow>,
): MessagingConversionDto {
  const eventStatusRows: MessagingConversionStatusRow[] = [];

  for (const row of eventRows) {
    if (row.stageRank === null) {
      continue;
    }
    const rank = aggregateCountService.coerceCount(row.stageRank);
    if (!Number.isInteger(rank)) {
      continue;
    }
    const stage = MESSAGING_STAGE_ORDER[rank];
    if (stage === undefined) {
      continue;
    }
    eventStatusRows.push({ lead_status: stage, count: row.count });
  }

  return mapRowsToConversionDto([...eventStatusRows, ...legacyRows]);
}

function getCumulativeStageCount(
  countByCurrentStage: ReadonlyMap<MessagingStage, number>,
  startIndex: number,
): number {
  return MESSAGING_STAGE_ORDER.slice(startIndex).reduce(
    (total, stage) => total + (countByCurrentStage.get(stage) ?? 0),
    0,
  );
}

function mapRowsToConversionDto(
  rows: ReadonlyArray<MessagingConversionStatusRow>,
): MessagingConversionDto {
  const countByCurrentStage = aggregateCurrentStageCounts(rows);
  const countByStage = new Map<MessagingStage, number>();

  MESSAGING_STAGE_ORDER.forEach((stage, index) => {
    countByStage.set(
      stage,
      getCumulativeStageCount(countByCurrentStage, index),
    );
  });

  const steps: MessagingConversionStepDto[] = MESSAGING_STAGE_ORDER.map(
    (key, index) => {
      const count = countByStage.get(key) ?? 0;
      const previousStage =
        index === 0 ? null : MESSAGING_STAGE_ORDER[index - 1];
      const previousCount =
        previousStage === null || previousStage === undefined
          ? null
          : (countByStage.get(previousStage) ?? 0);

      return {
        key,
        count,
        rateFromPrev: computeRateFromPrev(count, previousCount),
      };
    },
  );

  const contactedCount = countByStage.get(ContactLeadStatus.Contacted) ?? 0;
  const settingCallCount = countByStage.get(ContactLeadStatus.SettingCall) ?? 0;
  const closingCallCount = countByStage.get(ContactLeadStatus.ClosingCall) ?? 0;
  const wonCount = countByStage.get(ContactLeadStatus.Won) ?? 0;

  return {
    steps,
    contactedToSetting: computeSpanRate(contactedCount, settingCallCount),
    contactedToClosing: computeSpanRate(contactedCount, closingCallCount),
    contactedToWon: computeSpanRate(contactedCount, wonCount),
  };
}

export const messagingConversionMappingService = {
  mapRangedRowsToConversionDto,
  mapRowsToConversionDto,
};
