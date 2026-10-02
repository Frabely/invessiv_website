"use client";

import { useState } from "react";
import { faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import { isOnboardingReviewOpen } from "@invessiv/common/patterns/crm/onboarding/onboarding-form-state";
import { summarizeOnboardingReview } from "@invessiv/common/patterns/crm/onboarding/onboarding-review";
import { resolveQuestionnaireBlock } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-resolved-block";
import { PrimaryCtaButton } from "@invessiv/ui";
import type { OnboardingFormErrorTexts } from "@/common/contracts/crm/onboarding/onboarding-form-error-texts";
import { buildOnboardingCallAgenda } from "@/common/patterns/crm/onboarding/onboarding-call-agenda";
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
      <ol aria-label={texts.blocks.heading} className={styles.blocks}>
        {form.blocks.map((step) => {
          const blockName = questionnaireBlockName(step.block, locale);
          return (
            <OnboardingReviewBlockCard
              answers={
                <OnboardingAnswerReadView
                  answerFiles={form.answerFiles}
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
