"use client";

import Link from "next/link";
import { useState } from "react";
import {
  faArrowUpRightFromSquare,
  faCircleInfo,
  faPlay,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { PrimaryCtaButton, PrimaryCtaLink } from "@invessiv/ui";
import type { OnboardingFormErrorTexts } from "@/common/contracts/crm/onboarding/onboarding-form-error-texts";
import type { OnboardingViewModel } from "@/common/contracts/crm/onboarding/onboarding-view-model";
import { describeOnboardingReviewSummary } from "@/common/patterns/crm/onboarding/onboarding-review-summary-text";
import { CollapsibleSection } from "@/components/workspace/crm/shared/collapsible-section/collapsible-section";
import { SectionEmptyState } from "@/components/workspace/crm/shared/section-empty-state/section-empty-state";
import type { Locale } from "@/config/i18n";
import type { CrmOnboardingDictionary } from "@/i18n/dictionaries/workspace/crm";
import { OnboardingStartDialog } from "../onboarding-start-dialog/onboarding-start-dialog";
import { OnboardingStatusBadge } from "../onboarding-status-badge/onboarding-status-badge";
import styles from "./project-onboarding-section.module.css";

type ProjectOnboardingSectionProps = {
  content: CrmOnboardingDictionary;
  /** Error texts of the questionnaire kit; a start can fail with one of its codes. */
  kitErrors: OnboardingFormErrorTexts["questionnaire"];
  labelCollapse: string;
  labelExpand: string;
  locale: Locale;
  viewModel: OnboardingViewModel;
};

/**
 * Onboarding of one project: the purpose and the start while there is no form, afterwards its
 * status, the progress and the way to the form. Whether a start is possible is the server's
 * answer; the section only shows it.
 */
export function ProjectOnboardingSection({
  content,
  kitErrors,
  labelCollapse,
  labelExpand,
  locale,
  viewModel,
}: ProjectOnboardingSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { state, formHref } = viewModel;
  const { form } = state;
  const text = content.project;
  // The review only says something once the customer has submitted.
  const review =
    form?.submittedAt && state.review
      ? describeOnboardingReviewSummary(state.review, content.review.summary)
      : null;

  return (
    <CollapsibleSection
      action={
        state.canStart ? (
          <PrimaryCtaButton
            className={styles.action}
            onClick={() => setDialogOpen(true)}
            type="button"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faPlay} />
            {text.start}
          </PrimaryCtaButton>
        ) : form && formHref ? (
          <PrimaryCtaLink
            className={styles.action}
            href={formHref}
            linkComponent={Link}
          >
            <FontAwesomeIcon
              aria-hidden="true"
              icon={faArrowUpRightFromSquare}
            />
            {text.open}
          </PrimaryCtaLink>
        ) : null
      }
      after={
        dialogOpen ? (
          <OnboardingStartDialog
            content={text.dialog}
            errorTexts={{
              onboarding: content.errors,
              questionnaire: kitErrors,
            }}
            locale={locale}
            onCloseAction={() => setDialogOpen(false)}
            prefillAvailable={state.prefillAvailable}
            projectId={viewModel.projectId}
            templates={viewModel.templates}
          />
        ) : null
      }
      defaultExpanded
      labelCollapse={labelCollapse}
      labelExpand={labelExpand}
      meta={
        form ? (
          <OnboardingStatusBadge
            label={content.status[form.status]}
            status={form.status}
          />
        ) : null
      }
      title={text.title}
    >
      {form ? (
        <div className={styles.summary}>
          {form.progress.totalRequired > 0 ? (
            <div className={styles.progress}>
              <progress
                aria-label={text.progressLabel}
                className={styles.meter}
                max={form.progress.totalRequired}
                value={form.progress.answeredRequired}
              />
              <span className={styles.progressText}>
                {formatMessage(text.progress, {
                  answered: form.progress.answeredRequired,
                  total: form.progress.totalRequired,
                })}
              </span>
            </div>
          ) : (
            <p className={styles.hint}>{text.progressNone}</p>
          )}
          {review ? (
            <p className={styles.review}>
              <span>{review.reviewed}</span>
              <span>{review.clarifications}</span>
            </p>
          ) : null}
          {form.status === OnboardingFormStatus.Draft ? (
            <p className={styles.hint}>
              <FontAwesomeIcon aria-hidden="true" icon={faCircleInfo} />
              {text.draftHint}
            </p>
          ) : null}
        </div>
      ) : (
        <>
          <SectionEmptyState
            description={
              state.canStart
                ? text.empty.description
                : text.empty.readOnlyDescription
            }
            title={text.empty.title}
          />
          {state.projectEligible ? null : (
            <p className={styles.hint}>
              <FontAwesomeIcon aria-hidden="true" icon={faCircleInfo} />
              {text.notEligible}
            </p>
          )}
        </>
      )}
    </CollapsibleSection>
  );
}
