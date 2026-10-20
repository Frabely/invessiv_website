import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faCircleCheck,
  faCircleQuestion,
  faCircleXmark,
} from "@fortawesome/free-solid-svg-icons";
import type { FeedbackClarificationStatus } from "@invessiv/common/constants/crm/feedback-clarification-statuses";
import {
  BadgeTone,
  type BadgeTone as BadgeToneValue,
} from "@invessiv/common/constants/ui/badge-tones";

/** Icon and tone per clarification status; CRM and portal word the label themselves. */
export const FEEDBACK_CLARIFICATION_STATUS_BADGES = {
  open: { icon: faCircleQuestion, tone: BadgeTone.Warning },
  answered: { icon: faCircleCheck, tone: BadgeTone.Success },
  closed: { icon: faCircleXmark, tone: BadgeTone.Neutral },
} as const satisfies Record<
  FeedbackClarificationStatus,
  { icon: IconDefinition; tone: BadgeToneValue }
>;
