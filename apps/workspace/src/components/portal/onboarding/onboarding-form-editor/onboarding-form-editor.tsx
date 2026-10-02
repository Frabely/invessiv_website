"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PortalOnboardingErrorCode } from "@invessiv/common/constants/portal/portal-onboarding-error-codes";
import type { QuestionnaireGroupEntryDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-group-entry.dto";
import type { PortalOnboardingFormDto } from "@invessiv/common/contracts/portal/portal-onboarding-form.dto";
import { getQuestionnaireCompleteness } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-completeness";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl, PrimaryCtaButton } from "@invessiv/ui";
import { portalOnboardingApiService } from "@/client/portal/portal-onboarding-api-service";
import { PORTAL_ONBOARDING_REVIEW_SECTION } from "@/common/constants/portal/portal-onboarding-query-params";
import { DraftSaveState } from "@/common/constants/shared/draft-save-states";
import type { OnboardingFieldFormContext } from "@/common/contracts/portal/onboarding-field-form-context";
import type { OnboardingMissingAnswer } from "@/common/contracts/portal/onboarding-missing-answer";
import type { PortalOnboardingStepTarget } from "@/common/contracts/portal/portal-onboarding-step-target";
import { onboardingAnswerDrafts } from "@/common/patterns/portal/onboarding-answer-drafts";
import { DraftSaveStatus } from "@/components/shared/draft-save-status/draft-save-status";
import type { OnboardingAnswerReadViewProps } from "@/components/shared/onboarding/onboarding-answer-read-view/onboarding-answer-read-view";
import type { Locale } from "@/config/i18n";
import { useOnboardingAutosave } from "@/hooks/portal/use-onboarding-autosave";
import { useOnboardingFormState } from "@/hooks/portal/use-onboarding-form-state";
import { usePortalOnboardingStep } from "@/hooks/portal/use-portal-onboarding-step";
import type {
  PortalFilesDictionary,
  PortalOnboardingDictionary,
} from "@/i18n/dictionaries/portal";
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
  /** Upload as well as attach, which needs `portal.files.write` on top. */
  canUpload: boolean;
  content: PortalOnboardingDictionary;
  customerId: string;
  /** How attached files open in blocks the contact may only read right now. */
  files: OnboardingAnswerReadViewProps["files"];
  filesContent: PortalFilesDictionary;
  /** A form this contact may write into. */
  form: PortalOnboardingFormDto;
  locale: Locale;
  onAnnounceAction: (message: string) => void;
  /** The server no longer holds what the form shows; the view reloads and starts the form over. */
  onStaleAction: () => void;
};

/**
 * The form while it is filled in: one block per step, answers saved as they are typed, group
 * entries, files and the confirmation of the services saved as they happen, the review as the
 * last step. Conditions and progress follow the local state through the same function the server
 * runs again when the form is submitted.
 */
export function OnboardingFormEditor({
  canUpload,
  content,
  customerId,
  files,
  filesContent,
  form,
  locale,
  onAnnounceAction,
  onStaleAction,
}: OnboardingFormEditorProps) {
  const router = useRouter();
  const state = useOnboardingFormState({
    customerId,
    form,
    leaveWarning: content.draft.leaveWarning,
    onLockedAction: onStaleAction,
  });
  const autosave = useOnboardingAutosave({
    customerId,
    form,
    leaveWarning: content.draft.leaveWarning,
    onLockedAction: onStaleAction,
    waitForEntryAction: state.whenEntryReady,
  });
  const sections = useMemo(
    () => [
      ...form.blocks.map((block) => block.id),
      PORTAL_ONBOARDING_REVIEW_SECTION,
    ],
    [form.blocks],
  );
  // During a change request the first block is usually read-only; the form opens on the first
  // one the customer can work on.
  const step = usePortalOnboardingStep(
    sections,
    form.blocks.find((block) => form.editableBlockIds.includes(block.id))?.id,
  );
  const [navigated, setNavigated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<ReadonlySet<string>>(new Set());

  const input = useMemo(
    () => ({
      blocks: form.blocks,
      answers: autosave.answers,
      // Files the contact may not open count as well, exactly as the server counts them.
      answerFiles: [...state.answerFiles, ...form.hiddenAnswerFiles],
      groupEntries: state.groupEntries,
      servicesConfirmed: state.servicesConfirmed,
    }),
    [
      autosave.answers,
      form.blocks,
      form.hiddenAnswerFiles,
      state.answerFiles,
      state.groupEntries,
      state.servicesConfirmed,
    ],
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
              groupEntryId: entry.groupEntryId,
              fieldLabel: field.label,
            },
          ]
        : [];
    });
  }, [completeness.missing, form.blocks]);

  const trackUpload = useCallback((slotKey: string, active: boolean) => {
    setUploading((current) => {
      if (current.has(slotKey) === active) return current;
      const next = new Set(current);
      if (active) next.add(slotKey);
      else next.delete(slotKey);
      return next;
    });
  }, []);

  const index = sections.indexOf(step.section);
  const block = form.blocks.find((entry) => entry.id === step.section);

  function goTo(target: PortalOnboardingStepTarget) {
    // A step change unmounts the fields of the step, which cancels their running uploads.
    if (uploading.size > 0 && !window.confirm(filesContent.upload.leaveWarning))
      return;
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

  async function removeEntry(entry: QuestionnaireGroupEntryDto) {
    if (!(await state.removeEntry(entry))) return;
    autosave.discardEntry(entry.id);
    onAnnounceAction(content.announcements.entryRemoved);
  }

  async function moveEntry(
    entry: QuestionnaireGroupEntryDto,
    direction: -1 | 1,
  ) {
    const entries = await state.moveEntry(entry, direction);
    const position = entries?.findIndex((moved) => moved.id === entry.id) ?? -1;
    if (position >= 0)
      onAnnounceAction(
        formatMessage(content.announcements.entryMoved, {
          number: position + 1,
        }),
      );
  }

  /** Saves first, so what is submitted is exactly what the customer sees. */
  async function submit() {
    if (busy || uploading.size > 0) return;
    setBusy(true);
    setSubmitError(null);
    await state.settle();
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
    if (STALE_CODES.includes(result.code)) onStaleAction();
  }

  const fieldForm: OnboardingFieldFormContext = {
    answerFiles: state.answerFiles,
    busy: state.busy,
    hiddenAnswerFiles: form.hiddenAnswerFiles,
    canAttach: form.canAttach,
    canUpload,
    content,
    customerId,
    drafts: autosave.drafts,
    errors: state.errors,
    filesContent,
    input,
    invalid: autosave.invalid,
    locale,
    onAddEntryAction: state.addEntry,
    onAnnounceAction,
    onAttachFileAction: state.attachFile,
    onChangeAction: autosave.change,
    onCommitAction: autosave.commit,
    onConfirmServicesAction: state.confirmServices,
    onOpenServicesRemarkAction: state.openServicesRemark,
    servicesRemarkOpen: state.servicesRemarkOpen,
    onDetachFileAction: state.detachFile,
    onMoveEntryAction: (entry, direction) => void moveEntry(entry, direction),
    onRemoveEntryAction: (entry) => void removeEntry(entry),
    onUploadActivityAction: trackUpload,
    projectId: form.projectId,
    services: form.services,
    servicesError: state.servicesError,
    servicesNote: state.servicesNote,
  };

  // One status line for the whole form: a group, file or services command counts like a save.
  const saveState = state.busy
    ? DraftSaveState.Saving
    : autosave.saveState === DraftSaveState.Idle && state.savedAt
      ? DraftSaveState.Saved
      : autosave.saveState;
  const savedAt =
    state.savedAt && (!autosave.savedAt || state.savedAt > autosave.savedAt)
      ? state.savedAt
      : autosave.savedAt;

  return (
    <div className={styles.editor}>
      <OnboardingStepTrack
        blocks={form.blocks}
        completeness={completeness}
        content={content}
        current={step.section}
        input={input}
        onSelectAction={(section) => goTo({ section })}
      />
      {block ? (
        <OnboardingBlockStep
          block={block}
          content={content}
          editable={form.editableBlockIds.includes(block.id)}
          files={files}
          focusFieldId={step.fieldId}
          form={fieldForm}
          key={block.id}
          locale={locale}
          moveFocus={navigated}
        />
      ) : (
        <OnboardingSubmitStep
          busy={busy || state.busy || uploading.size > 0}
          content={content}
          error={submitError}
          missing={missing}
          moveFocus={navigated}
          onJumpAction={(answer) =>
            goTo({
              section: answer.blockId,
              fieldId: onboardingAnswerDrafts.slotKey(
                answer.fieldId,
                answer.groupEntryId,
              ),
            })
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
          saveState={saveState}
          savedAt={savedAt}
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
