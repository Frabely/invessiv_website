import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faCircleCheck,
  faInbox,
  faPaperPlane,
  faPenRuler,
  faRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import type { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import {
  BadgeTone,
  type BadgeTone as BadgeToneValue,
} from "@invessiv/common/constants/ui/badge-tones";

/** Icon and tone per form status; the label comes from the dictionary of the caller. */
export const ONBOARDING_FORM_STATUS_BADGES = {
  draft: { icon: faPenRuler, tone: BadgeTone.Neutral },
  open: { icon: faPaperPlane, tone: BadgeTone.Info },
  submitted: { icon: faInbox, tone: BadgeTone.Primary },
  changes_requested: { icon: faRotateLeft, tone: BadgeTone.Warning },
  completed: { icon: faCircleCheck, tone: BadgeTone.Success },
} as const satisfies Record<
  OnboardingFormStatus,
  { icon: IconDefinition; tone: BadgeToneValue }
>;
