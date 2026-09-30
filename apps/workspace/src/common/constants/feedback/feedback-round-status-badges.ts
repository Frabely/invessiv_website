import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faCircleCheck,
  faComments,
  faFlagCheckered,
  faInbox,
  faPenToSquare,
  faScrewdriverWrench,
} from "@fortawesome/free-solid-svg-icons";
import type { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import {
  BadgeTone,
  type BadgeTone as BadgeToneValue,
} from "@invessiv/common/constants/ui/badge-tones";

/** Icon and tone per round status; CRM and portal word the label themselves. */
export const FEEDBACK_ROUND_STATUS_BADGES = {
  open: { icon: faPenToSquare, tone: BadgeTone.Info },
  submitted: { icon: faInbox, tone: BadgeTone.Primary },
  in_discussion: { icon: faComments, tone: BadgeTone.Warning },
  in_progress: { icon: faScrewdriverWrench, tone: BadgeTone.Warning },
  completed: { icon: faCircleCheck, tone: BadgeTone.Success },
  approved: { icon: faFlagCheckered, tone: BadgeTone.Success },
} as const satisfies Record<
  FeedbackRoundStatus,
  { icon: IconDefinition; tone: BadgeToneValue }
>;
