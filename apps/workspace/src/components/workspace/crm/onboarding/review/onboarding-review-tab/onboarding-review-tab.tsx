"use client";

import { useState } from "react";
import { faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import { isOnboardingReviewOpen } from "@invessiv/common/patterns/crm/onboarding/onboarding-form-state";
import { summarizeOnboardingReview } from "@invessiv/common/patterns/crm/onboarding/onboarding-review";
import { resolveQuestionnaireBlock } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-resolved-block";
import { Badge, PrimaryCtaButton } from "@invessiv/ui";
import { ONBOARDING_REVIEW_BADGES } from "@/common/constants/crm/onboarding/onboarding-review-badges";
import {
  ONBOARDING_REVIEW_FILTER_VALUES,
  OnboardingReviewFilter,
} from "@/common/constants/crm/onboarding/onboarding-review-filters";
import type { OnboardingFormErrorTexts } from "@/common/contracts/crm/onboarding/onboarding-form-error-texts";
import { buildOnboardingCallAgenda } from "@/common/patterns/crm/onboarding/onboarding-call-agenda";
import {
  buildOnboardingReviewFilterHref,
  readOnboardingReviewFilter,
} from "@/common/patterns/crm/onboarding/onboarding-form-query";
import { describeOnboardingReviewSummary } from "@/common/patterns/crm/onboarding/onboarding-review-summary-text";
import { questionnaireBlockName } from "@/common/patterns/crm/questionnaire/questionnaire-display-name";
import { OnboardingAnswerReadView } from "@/components/shared/onboarding/onboarding-answer-read-view/onboarding-answer-read-view";
import { SectionEmptyState } from "@/components/workspace/crm/shared/section-empty-state/section-empty-state";
import type { Locale } from "@/config/i18n";
import { useOnboardingFileDownloads } from "@/hooks/workspace/use-onboarding-file-downloads";
import type {
  CrmFilesDictionary,
  CrmOnboardingDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import { OnboardingCallAgenda } from "../onboarding-call-agenda/onboarding-call-agenda";
import { OnboardingRequestChangesDialog } from "../onboarding-request-changes-dialog/onboarding-request-changes-dialog";
import { OnboardingReviewBlockCard } from "../onboarding-review-block-card/onboarding-review-block-card";
import { OnboardingReviewControls } from "../onboarding-review-controls/onboarding-review-controls";
import styles from "./onboarding-review-tab.module.css";

export type OnboardingReviewTabProps = {
  canWrite: boolean;
  content: CrmOnboardingDictionary;
  errorTexts: OnboardingFormErrorTexts;
  /** File texts and errors for downloads and previews of attached files. */
  filesContent: CrmFilesDictionary;
  form: OnboardingFormDto;
  locale: Locale;
  onAnnounceAction: (message: string) => void;
  /** Every write answers with the whole form; the page adopts it. */
  onFormChangeAction: (form: OnboardingFormDto) => void;
  /** Names the project in the copied agenda. */
  projectTitle: string;
};

/**
 * The review of a submitted form: the agenda for the call on top, then every block in form order
 * with the customer's answers and the team's result. Whether the review is open is the rule the
 * server enforces (`isOnboardingReviewOpen`); outside of it the results stand as a record.
 */
export function OnboardingReviewTab({
  canWrite,
  content,
  errorTexts,
  filesContent,
  form,
  locale,
  onAnnounceAction,
  onFormChangeAction,
  projectTitle,
}: OnboardingReviewTabProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filter = readOnboardingReviewFilter(searchParams);
  const [requesting, setRequesting] = useState(false);
  const downloads = useOnboardingFileDownloads(
    form.customerId,
    filesContent.errors,
  );
  const texts = content.review;

  if (
    form.status === OnboardingFormStatus.Draft ||
    form.status === OnboardingFormStatus.Open
  )
    return (
      <div className={styles.tab}>
        <SectionEmptyState
          description={texts.states.notSubmitted.description}
          title={texts.states.notSubmitted.title}
        />
      </div>
    );

  const open = isOnboardingReviewOpen(form.status);
  const editable = open && canWrite;
  const summary = summarizeOnboardingReview(form.blocks);
  const filterCounts: Record<OnboardingReviewFilter, number> = {
    [OnboardingReviewFilter.All]: summary.total,
    [OnboardingReviewFilter.Pending]: summary.total - summary.reviewed,
    [OnboardingReviewFilter.Complete]:
      summary.reviewed - summary.clarifications,
    [OnboardingReviewFilter.Clarification]: summary.clarifications,
  };
  const visibleBlocks =
    filter === OnboardingReviewFilter.All
      ? form.blocks
      : form.blocks.filter((step) => step.reviewStatus === filter);
  const summaryText = describeOnboardingReviewSummary(summary, texts.summary);
  let notice: string | null = null;
  if (form.status === OnboardingFormStatus.ChangesRequested) {
    notice = texts.states.changesRequested;
  } else if (form.status === OnboardingFormStatus.Completed) {
    notice = texts.states.completed;
  } else if (!canWrite) {
    notice = texts.states.readOnly;
  }

  return (
    <div className={styles.tab}>
      {notice ? <p className={styles.notice}>{notice}</p> : null}
      <div className={styles.bar}>
        <p className={styles.summary}>
          <span>{summaryText.reviewed}</span>
          <span className={styles.questions}>{summaryText.clarifications}</span>
        </p>
        {editable ? (
          <div className={styles.request}>
            <PrimaryCtaButton
              disabled={summary.customerClarifications === 0}
              onClick={() => setRequesting(true)}
              type="button"
            >
              <FontAwesomeIcon aria-hidden="true" icon={faRotateLeft} />
              {texts.request.action}
            </PrimaryCtaButton>
            {summary.customerClarifications === 0 ? (
              <p className={styles.hint}>{texts.request.hint}</p>
            ) : null}
          </div>
        ) : null}
      </div>
      <OnboardingCallAgenda
        agenda={buildOnboardingCallAgenda(form, locale)}
        content={texts.agenda}
        projectTitle={projectTitle}
      />
      {downloads.actionError ? (
        <p className={styles.error} role="alert">
          {downloads.actionError}
        </p>
      ) : null}
      <div
        aria-label={texts.filter.label}
        className={styles.filters}
        role="group"
      >
        {ONBOARDING_REVIEW_FILTER_VALUES.map((choice) => (
          <button
            aria-pressed={filter === choice}
            className={styles.filter}
            key={choice}
            onClick={() =>
              router.replace(
                buildOnboardingReviewFilterHref(
                  pathname,
                  searchParams.toString(),
                  choice,
                ),
                { scroll: false },
              )
            }
            type="button"
          >
            <Badge
              icon={ONBOARDING_REVIEW_BADGES[choice].icon}
              label={`${choice === OnboardingReviewFilter.All ? texts.filter.all : texts.status[choice]} ${filterCounts[choice]}`}
              tone={ONBOARDING_REVIEW_BADGES[choice].tone}
            />
          </button>
        ))}
      </div>
      {form.blocks.length === 0 ? (
        <SectionEmptyState
          description={texts.empty.noBlocks.description}
          title={texts.empty.noBlocks.title}
        />
      ) : visibleBlocks.length === 0 ? (
        <SectionEmptyState
          description={texts.empty.noMatches.description}
          title={texts.empty.noMatches.title}
        />
      ) : (
        <ol aria-label={texts.blocks.heading} className={styles.blocks}>
          {visibleBlocks.map((step) => {
            const blockName = questionnaireBlockName(step.block, locale);
            return (
              <OnboardingReviewBlockCard
                answers={
                  <OnboardingAnswerReadView
                    answerFiles={form.answerFiles}
                    hiddenAnswerFiles={form.hiddenAnswerFiles}
                    answers={form.answers}
                    blocks={[resolveQuestionnaireBlock(step.block, locale)]}
                    files={{
                      loadPreviewAction: downloads.loadPreview,
                      locale,
                      onDownloadAction: downloads.download,
                      texts: filesContent,
                    }}
                    groupEntries={form.groupEntries}
                    services={form.services}
                    servicesConfirmed={form.servicesConfirmedAt !== null}
                    servicesNote={form.servicesNote}
                    showBlockTitles={false}
                    texts={content.answers.read}
                  />
                }
                blockName={blockName}
                content={texts}
                controls={
                  editable ? (
                    <OnboardingReviewControls
                      blockName={blockName}
                      content={texts}
                      errorTexts={errorTexts}
                      formId={form.id}
                      onConflictAction={onFormChangeAction}
                      onReviewedAction={(next, announcement) => {
                        onFormChangeAction(next);
                        onAnnounceAction(announcement);
                      }}
                      step={step}
                    />
                  ) : null
                }
                key={step.block.id}
                locale={locale}
                step={step}
              />
            );
          })}
        </ol>
      )}
      {requesting ? (
        <OnboardingRequestChangesDialog
          content={texts.request.dialog}
          errorTexts={errorTexts}
          form={form}
          locale={locale}
          onCloseAction={() => setRequesting(false)}
          onConflictAction={onFormChangeAction}
          onRequestedAction={(next) => {
            setRequesting(false);
            onFormChangeAction(next);
            onAnnounceAction(texts.request.sent);
          }}
        />
      ) : null}
    </div>
  );
}
