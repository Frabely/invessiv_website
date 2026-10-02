"use client";

import type { ReactNode } from "react";
import { OnboardingBlockReviewStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-block-review-statuses";
import type { OnboardingFormBlockDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form-block.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { LinkedText } from "@invessiv/ui";
import type { Locale } from "@/config/i18n";
import type { CrmOnboardingDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatMomentDay } from "@/lib/i18n/format-moment-day";
import styles from "./onboarding-review-block-card.module.css";

export type OnboardingReviewBlockCardProps = {
  /** The answers of this block, rendered by the shared read view. */
  answers: ReactNode;
  /** Block title in the interface language. */
  blockName: string;
  content: CrmOnboardingDictionary["review"];
  /** The review controls while the review is open for this member; otherwise the stored result. */
  controls: ReactNode | null;
  locale: Locale;
  step: OnboardingFormBlockDto;
};

/**
 * One block under review: what the customer answered, then what the team makes of it. The rail on
 * the left carries the result, so the state of a long form reads at a glance while scrolling.
 */
export function OnboardingReviewBlockCard({
  answers,
  blockName,
  content,
  controls,
  locale,
  step,
}: OnboardingReviewBlockCardProps) {
  const asked = step.reviewStatus === OnboardingBlockReviewStatus.Clarification;

  return (
    <li className={styles.card} data-review={step.reviewStatus}>
      <div className={styles.head}>
        <h3 className={styles.title}>{blockName}</h3>
        <span className={styles.result}>
          {content.status[step.reviewStatus]}
          {asked && step.clarificationMode
            ? `: ${content.mode[step.clarificationMode]}`
            : null}
        </span>
      </div>
      <div className={styles.answers}>{answers}</div>
      <div className={styles.review}>
        {controls ??
          (asked && step.reviewNote ? (
            <p className={styles.note}>
              <LinkedText text={step.reviewNote} />
            </p>
          ) : null)}
        {step.reviewedAt ? (
          <p className={styles.reviewedAt}>
            {formatMessage(content.controls.reviewedAt, {
              date: formatMomentDay(step.reviewedAt, locale),
            })}
          </p>
        ) : null}
      </div>
    </li>
  );
}
