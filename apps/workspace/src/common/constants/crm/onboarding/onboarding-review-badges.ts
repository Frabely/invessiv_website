import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faCircleCheck,
  faCircleQuestion,
  faClock,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";
import {
  BadgeTone,
  type BadgeTone as BadgeToneValue,
} from "@invessiv/common/constants/ui/badge-tones";
import {
  OnboardingReviewFilter,
  type OnboardingReviewFilter as OnboardingReviewFilterValue,
} from "./onboarding-review-filters";

export const ONBOARDING_REVIEW_BADGES = {
  [OnboardingReviewFilter.All]: { icon: faLayerGroup, tone: BadgeTone.Neutral },
  [OnboardingReviewFilter.Pending]: { icon: faClock, tone: BadgeTone.Warning },
  [OnboardingReviewFilter.Complete]: {
    icon: faCircleCheck,
    tone: BadgeTone.Success,
  },
  [OnboardingReviewFilter.Clarification]: {
    icon: faCircleQuestion,
    tone: BadgeTone.Info,
  },
} as const satisfies Record<
  OnboardingReviewFilterValue,
  { icon: IconDefinition; tone: BadgeToneValue }
>;
