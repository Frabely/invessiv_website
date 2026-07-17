import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import { MESSAGING_STAGE_ORDER } from "@/common/constants/dashboard/messaging-stage-order";
import type { FunnelSnapshotDto } from "@/common/contracts/dashboard/funnel-snapshot.dto";
import type { MessagingConversionDto } from "@/common/contracts/dashboard/messaging-conversion.dto";
import type { MessagingConversionSpanRateDto } from "@/common/contracts/dashboard/messaging-conversion-span-rate.dto";
import type { MessagingConversionStepDto } from "@/common/contracts/dashboard/messaging-conversion-step.dto";

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

function mapSnapshotToConversionDto(
  snapshot: FunnelSnapshotDto,
): MessagingConversionDto {
  const countByStage = new Map<string, number>();
  for (const stage of snapshot.stages) {
    countByStage.set(stage.key, stage.count);
  }

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
  mapSnapshotToConversionDto,
};
