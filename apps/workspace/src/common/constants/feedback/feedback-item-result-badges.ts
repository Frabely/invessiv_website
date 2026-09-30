import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBan,
  faCircleCheck,
  faCirclePlus,
} from "@fortawesome/free-solid-svg-icons";
import type { FeedbackItemResult } from "@invessiv/common/constants/crm/feedback-item-results";
import {
  BadgeTone,
  type BadgeTone as BadgeToneValue,
} from "@invessiv/common/constants/ui/badge-tones";

/** Icon and tone per item result; CRM and portal word the label themselves. */
export const FEEDBACK_ITEM_RESULT_BADGES = {
  implemented: { icon: faCircleCheck, tone: BadgeTone.Success },
  not_implemented: { icon: faBan, tone: BadgeTone.Neutral },
  additional_service: { icon: faCirclePlus, tone: BadgeTone.Warning },
} as const satisfies Record<
  FeedbackItemResult,
  { icon: IconDefinition; tone: BadgeToneValue }
>;
