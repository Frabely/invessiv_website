import type { OnboardingReviewSummary } from "@invessiv/common/contracts/crm/onboarding/onboarding-review-summary";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import type { OnboardingReviewSummaryTexts } from "@/common/contracts/crm/onboarding/onboarding-review-summary-texts";

/** The two facts every surface shows about a review: how far it is and how many questions are open. */
export function describeOnboardingReviewSummary(
  summary: OnboardingReviewSummary,
  texts: OnboardingReviewSummaryTexts,
): { reviewed: string; clarifications: string } {
  let clarifications = texts.clarificationsNone;
  if (summary.clarifications === 1) {
    clarifications = texts.clarificationsOne;
  } else if (summary.clarifications > 1) {
    clarifications = formatMessage(texts.clarifications, {
      count: summary.clarifications,
    });
  }

  return {
    reviewed: formatMessage(texts.reviewed, {
      reviewed: summary.reviewed,
      total: summary.total,
    }),
    clarifications,
  };
}
