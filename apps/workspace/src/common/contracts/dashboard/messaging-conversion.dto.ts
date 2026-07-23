import type { MessagingConversionSpanRateDto } from "@/common/contracts/dashboard/messaging-conversion-span-rate.dto";
import type { MessagingConversionStepDto } from "@/common/contracts/dashboard/messaging-conversion-step.dto";

export type MessagingConversionDto = {
  steps: ReadonlyArray<MessagingConversionStepDto>;
  contactedToSetting: MessagingConversionSpanRateDto;
  contactedToClosing: MessagingConversionSpanRateDto;
  contactedToWon: MessagingConversionSpanRateDto;
};
