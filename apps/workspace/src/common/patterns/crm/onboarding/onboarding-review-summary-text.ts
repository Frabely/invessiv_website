import type { OnboardingReviewSummary } from "@invessiv/common/contracts/crm/onboarding/onboarding-review-summary";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import type { OnboardingReviewSummaryTexts } from "@/common/contracts/crm/onboarding/onboarding-review-summary-texts";

/** The two facts every surface shows about a review: how far it is and how many questions are open. */
export function describeOnboardingReviewSummary(
  summary: OnboardingReviewSummary,
  texts: OnboardingReviewSummaryTexts,
): { reviewed: string; clarifications: string } {
  return {
    reviewed: formatMessage(texts.reviewed, {
      reviewed: summary.reviewed,
      total: summary.total,
    }),
    clarifications:
      summary.clarifications === 0
        ? texts.clarificationsNone
        : summary.clarifications === 1
          ? texts.clarificationsOne
          : formatMessage(texts.clarifications, {
              count: summary.clarifications,
            }),
  };
}
