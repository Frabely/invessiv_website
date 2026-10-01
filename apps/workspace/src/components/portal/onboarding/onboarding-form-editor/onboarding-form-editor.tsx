"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PortalOnboardingErrorCode } from "@invessiv/common/constants/portal/portal-onboarding-error-codes";
import type { PortalOnboardingFormDto } from "@invessiv/common/contracts/portal/portal-onboarding-form.dto";
import { getQuestionnaireCompleteness } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-completeness";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl, PrimaryCtaButton } from "@invessiv/ui";
import { portalOnboardingApiService } from "@/client/portal/portal-onboarding-api-service";
import { PORTAL_ONBOARDING_REVIEW_SECTION } from "@/common/constants/portal/portal-onboarding-query-params";
import type { OnboardingMissingAnswer } from "@/common/contracts/portal/onboarding-missing-answer";
import type { PortalOnboardingStepTarget } from "@/common/contracts/portal/portal-onboarding-step-target";
import { onboardingAnswerDrafts } from "@/common/patterns/portal/onboarding-answer-drafts";
import { DraftSaveStatus } from "@/components/shared/draft-save-status/draft-save-status";
import type { Locale } from "@/config/i18n";
import { useOnboardingAutosave } from "@/hooks/portal/use-onboarding-autosave";
import { usePortalOnboardingStep } from "@/hooks/portal/use-portal-onboarding-step";
import type { PortalOnboardingDictionary } from "@/i18n/dictionaries/portal";
import { OnboardingBlockStep } from "../onboarding-block-step/onboarding-block-step";
import { OnboardingStepTrack } from "../onboarding-step-track/onboarding-step-track";
import { OnboardingSubmitStep } from "../onboarding-submit-step/onboarding-submit-step";
import styles from "./onboarding-form-editor.module.css";

// Codes after which the form on screen is no longer what the server holds.
const STALE_CODES: readonly PortalOnboardingErrorCode[] = [
  PortalOnboardingErrorCode.Locked,
  PortalOnboardingErrorCode.NotFound,
  PortalOnboardingErrorCode.RequiredMissing,
];

export type OnboardingFormEditorProps = {
  content: PortalOnboardingDictionary;
  customerId: string;
  /** A form this contact may write into. */
  form: PortalOnboardingFormDto;
  locale: Locale;
  onAnnounceAction: (message: string) => void;
};

/**
 * The form while it is filled in: one block per step, answers saved as they are typed, the review
 * as the last step. Conditions and progress follow the local answers through the same function
 * the server runs again when the form is submitted.
 */
export function OnboardingFormEditor({
  content,
  customerId,
  form,
  locale,
  onAnnounceAction,
}: OnboardingFormEditorProps) {
  const router = useRouter();
  const autosave = useOnboardingAutosave({
    customerId,
    form,
    leaveWarning: content.draft.leaveWarning,
    onLockedAction: () => router.refresh(),
  });
  const sections = useMemo(
    () => [
      ...form.blocks.map((block) => block.id),
      PORTAL_ONBOARDING_REVIEW_SECTION,
    ],
    [form.blocks],
  );
  const step = usePortalOnboardingStep(sections);
  const [navigated, setNavigated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const input = useMemo(
    () => ({
      blocks: form.blocks,
      answers: autosave.answers,
      answerFiles: form.answerFiles,
      groupEntries: form.groupEntries,
      servicesConfirmed: form.servicesConfirmed,
    }),
    [autosave.answers, form],
  );
  const completeness = useMemo(
    () => getQuestionnaireCompleteness(input),
    [input],
  );
  const missing = useMemo(() => {
    const fields = onboardingAnswerDrafts.indexFields(form.blocks);
    const titles = new Map(form.blocks.map((block) => [block.id, block.title]));
    return completeness.missing.flatMap((entry): OnboardingMissingAnswer[] => {
      const field = fields.get(entry.fieldId);
      return field
        ? [
            {
              blockId: entry.blockId,
              blockTitle: titles.get(entry.blockId) ?? "",
              fieldId: entry.fieldId,
              fieldLabel: field.label,
            },
          ]
        : [];
    });
  }, [completeness.missing, form.blocks]);

  const index = sections.indexOf(step.section);
  const block = form.blocks.find((entry) => entry.id === step.section);

  function goTo(target: PortalOnboardingStepTarget) {
    const position = sections.indexOf(target.section ?? sections[0]);
    setNavigated(true);
    setSubmitError(null);
    step.goTo(target);
    window.scrollTo({ top: 0 });
    onAnnounceAction(
      formatMessage(content.announcements.step, {
        number: position + 1,
        total: sections.length,
        title: form.blocks[position]?.title ?? content.steps.review,
      }),
    );
  }

  /** Saves first, so what is submitted is exactly what the customer sees. */
  async function submit() {
    if (busy) return;
    setBusy(true);
    setSubmitError(null);
    if (!(await autosave.flush())) {
      setBusy(false);
      setSubmitError(
        autosave.invalid.size > 0
          ? content.submit.invalid
          : content.submit.notSaved,
      );
      return;
    }
    const result = await portalOnboardingApiService.submit(customerId, form.id);
    setBusy(false);
    if (result.ok) {
      onAnnounceAction(content.announcements.submitted);
      router.refresh();
      return;
    }
    setSubmitError(content.errors[result.code]);
    if (STALE_CODES.includes(result.code)) router.refresh();
  }

  return (
    <div className={styles.editor}>
      <OnboardingStepTrack
        answers={autosave.answers}
        blocks={form.blocks}
        completeness={completeness}
        content={content}
        current={step.section}
        onSelectAction={(section) => goTo({ section })}
      />
      {block ? (
        <OnboardingBlockStep
          block={block}
          content={content}
          drafts={autosave.drafts}
          editable={form.editableBlockIds.includes(block.id)}
          focusFieldId={step.fieldId}
          input={input}
          invalid={autosave.invalid}
          key={block.id}
          locale={locale}
          moveFocus={navigated}
          onChangeAction={autosave.change}
          onCommitAction={autosave.commit}
        />
      ) : (
        <OnboardingSubmitStep
          busy={busy}
          content={content}
          error={submitError}
          missing={missing}
          moveFocus={navigated}
          onJumpAction={(answer) =>
            goTo({ section: answer.blockId, fieldId: answer.fieldId })
          }
          onSubmitAction={submit}
          progress={completeness}
        />
      )}
      <div className={styles.bar}>
        <DraftSaveStatus
          errorText={
            autosave.errorCode ? content.errors[autosave.errorCode] : null
          }
          locale={locale}
          onRetryAction={autosave.retry}
          saveState={autosave.saveState}
          savedAt={autosave.savedAt}
          savedByName={autosave.savedByName}
          texts={content.draft}
        />
        <div className={styles.actions}>
          {index > 0 ? (
            <ButtonControl
              onClick={() => goTo({ section: sections[index - 1] })}
              type="button"
              variant="ghost"
            >
              {content.steps.back}
            </ButtonControl>
          ) : (
            <span />
          )}
          {index < sections.length - 1 ? (
            <PrimaryCtaButton
              onClick={() => goTo({ section: sections[index + 1] })}
              type="button"
            >
              {content.steps.next}
            </PrimaryCtaButton>
          ) : null}
        </div>
      </div>
    </div>
  );
}
