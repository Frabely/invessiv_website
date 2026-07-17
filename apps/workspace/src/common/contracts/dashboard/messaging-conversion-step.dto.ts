import type { MessagingStage } from "@/common/constants/dashboard/messaging-stage-order";

export type MessagingConversionStepDto = {
  key: MessagingStage;
  count: number;
  rateFromPrev: number | null;
};
