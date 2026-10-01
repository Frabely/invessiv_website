"use client";

import type { FeedbackAttachmentDto } from "@invessiv/common/contracts/crm/feedback-attachment.dto";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import { getQuestionnaireCompleteness } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-completeness";
import { resolveQuestionnaireBlock } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-resolved-block";
import { filesApiService } from "@/client/crm/files-api-service";
import { OnboardingAnswerReadView } from "@/components/shared/onboarding/onboarding-answer-read-view/onboarding-answer-read-view";
import { OnboardingProgressBar } from "@/components/shared/onboarding/onboarding-progress-bar/onboarding-progress-bar";
import type { Locale } from "@/config/i18n";
import { useFileDownloads } from "@/hooks/shared/use-file-downloads";
import type {
  CrmFilesDictionary,
  CrmOnboardingDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import styles from "./onboarding-form-answers-tab.module.css";

export type OnboardingFormAnswersTabProps = {
  content: CrmOnboardingDictionary;
  /** File texts and errors for downloads and previews of attached files. */
  filesContent: CrmFilesDictionary;
  form: OnboardingFormDto;
  /** Locale of the interface; block and field texts fall back to a maintained one. */
  locale: Locale;
};

/**
 * What the customer answered so far, read-only. The renderer is the one the portal shows after a
 * submission, fed with the same answers, so both sides read the same sheet. The form only carries
 * the files this member may read; they open through the internal file endpoints.
 */
export function OnboardingFormAnswersTab({
  content,
  filesContent,
  form,
  locale,
}: OnboardingFormAnswersTabProps) {
  const texts = content.answers;
  const downloads = useFileDownloads<FeedbackAttachmentDto>({
    archiveFilename: "",
    errors: filesContent.errors,
    selectedIds: [],
    clearSelection: () => undefined,
    getDownloadUrl: filesApiService.getDownloadUrl,
    readText: filesApiService.readText,
    getArchive: (ids) => filesApiService.downloadArchive(form.customerId, ids),
  });
  const input = {
    blocks: form.blocks.map((step) =>
      resolveQuestionnaireBlock(step.block, locale),
    ),
    answers: form.answers,
    answerFiles: form.answerFiles,
    groupEntries: form.groupEntries,
    servicesConfirmed: form.servicesConfirmedAt !== null,
    services: form.services,
    servicesNote: form.servicesNote,
  };

  return (
    <div className={styles.tab}>
      {input.blocks.length > 0 ? (
        <OnboardingProgressBar
          progress={getQuestionnaireCompleteness(input)}
          texts={texts.progress}
        />
      ) : null}
      {downloads.actionError ? (
        <p className={styles.error} role="alert">
          {downloads.actionError}
        </p>
      ) : null}
      <OnboardingAnswerReadView
        {...input}
        emptyText={texts.empty}
        files={{
          loadPreviewAction: downloads.loadPreview,
          locale,
          onDownloadAction: downloads.download,
          texts: filesContent,
        }}
        texts={texts.read}
      />
    </div>
  );
}
