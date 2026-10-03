"use client";

import { useId, useState } from "react";
import {
  ONBOARDING_BLOCK_REVIEW_STATUS_VALUES,
  OnboardingBlockReviewStatus,
} from "@invessiv/common/constants/crm/onboarding/onboarding-block-review-statuses";
import {
  ONBOARDING_CLARIFICATION_MODE_VALUES,
  OnboardingClarificationMode,
} from "@invessiv/common/constants/crm/onboarding/onboarding-clarification-modes";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import type { OnboardingFormBlockDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form-block.dto";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { ReviewOnboardingBlockRequestDto } from "@invessiv/common/contracts/crm/onboarding/review-onboarding-block-request.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { Badge, ButtonControl, FormField } from "@invessiv/ui";
import { onboardingFormApiService } from "@/client/crm/onboarding-form-api-service";
import { VersionedMutationOutcomeKind } from "@/common/constants/client/versioned-mutation-outcome-kinds";
import { ONBOARDING_REVIEW_BADGES } from "@/common/constants/crm/onboarding/onboarding-review-badges";
import type { OnboardingFormErrorTexts } from "@/common/contracts/crm/onboarding/onboarding-form-error-texts";
import { onboardingFormErrorText } from "@/common/patterns/crm/onboarding/onboarding-form-error-text";
import { useVersionedCommand } from "@/hooks/workspace/use-versioned-command";
import type { CrmOnboardingDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./onboarding-review-controls.module.css";

export type OnboardingReviewControlsProps = {
  /** Block title in the interface language, for the group name and the announcement. */
  blockName: string;
  content: CrmOnboardingDictionary["review"];
  errorTexts: OnboardingFormErrorTexts;
  formId: string;
  /** A stale review came back with the current form; the tab adopts it. */
  onConflictAction: (current: OnboardingFormDto) => void;
  onReviewedAction: (form: OnboardingFormDto, announcement: string) => void;
  /** The step as the server holds it; its version guards the write. */
  step: OnboardingFormBlockDto;
};

/**
 * The review of one block. "Open" and "complete" save with the click, because there is nothing
 * else to say; a question first needs its way and its text. After a conflict the typed question
 * stays and the next save runs against the version the page adopted.
 */
export function OnboardingReviewControls({
  blockName,
  content,
  errorTexts,
  formId,
  onConflictAction,
  onReviewedAction,
  step,
}: OnboardingReviewControlsProps) {
  const baseId = useId();
  const [status, setStatus] = useState(step.reviewStatus);
  const [mode, setMode] = useState(
    step.clarificationMode ?? OnboardingClarificationMode.Customer,
  );
  const [note, setNote] = useState(step.reviewNote ?? "");
  const { busy, run } = useVersionedCommand();
  const [failure, setFailure] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);
  const texts = content.controls;
  const asking = status === OnboardingBlockReviewStatus.Clarification;
  const unchangedQuestion =
    step.reviewStatus === OnboardingBlockReviewStatus.Clarification &&
    step.clarificationMode === mode &&
    step.reviewNote === note.trim();

  async function save(request: ReviewOnboardingBlockRequestDto) {
    setFailure(null);
    const result = await run(() =>
      onboardingFormApiService.reviewBlock(formId, step.block.id, request),
    );
    switch (result.kind) {
      case VersionedMutationOutcomeKind.Saved:
        onReviewedAction(
          result.value,
          formatMessage(texts.saved, { block: blockName }),
        );
        return;
      case VersionedMutationOutcomeKind.Conflict:
        // A typed question stays for a second try; a plain result follows what the server holds.
        if (!("note" in request))
          setStatus(
            result.current.blocks.find(
              (candidate) => candidate.block.id === step.block.id,
            )?.reviewStatus ?? step.reviewStatus,
          );
        setFailure(texts.conflict);
        onConflictAction(result.current);
        return;
      case VersionedMutationOutcomeKind.Failure:
        // The stored state stays what it was; the selection must not claim otherwise.
        setStatus(step.reviewStatus);
        setFailure(onboardingFormErrorText(result.code, errorTexts));
    }
  }

  function select(next: OnboardingBlockReviewStatus) {
    if (busy) return;
    setStatus(next);
    setFailure(null);
    setNoteError(null);
    if (
      next === OnboardingBlockReviewStatus.Clarification ||
      next === step.reviewStatus
    )
      return;
    void save({ reviewStatus: next, expectedVersion: step.version });
  }

  function saveQuestion() {
    if (busy) return;
    const text = note.trim();
    if (text === "") {
      setNoteError(texts.noteRequired);
      return;
    }
    if (text.length > QUESTIONNAIRE_LIMITS.noteMaxLength) {
      setNoteError(
        formatMessage(texts.noteTooLong, {
          max: QUESTIONNAIRE_LIMITS.noteMaxLength,
        }),
      );
      return;
    }
    setNoteError(null);
    void save({
      reviewStatus: OnboardingBlockReviewStatus.Clarification,
      clarificationMode: mode,
      note: text,
      expectedVersion: step.version,
    });
  }

  return (
    <div className={styles.controls}>
      <fieldset className={styles.group} disabled={busy}>
        <legend className="sr-only">
          {formatMessage(texts.legend, { block: blockName })}
        </legend>
        <div className={styles.segments}>
          {ONBOARDING_BLOCK_REVIEW_STATUS_VALUES.map((value) => (
            <label className={styles.segment} data-review={value} key={value}>
              <input
                checked={status === value}
                className={styles.input}
                name={`${baseId}-status`}
                onChange={() => select(value)}
                type="radio"
                value={value}
              />
              <span className={styles.segmentLabel}>
                <Badge
                  icon={ONBOARDING_REVIEW_BADGES[value].icon}
                  label={content.status[value]}
                  tone={ONBOARDING_REVIEW_BADGES[value].tone}
                />
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {asking ? (
        <div className={styles.question}>
          <fieldset className={styles.group} disabled={busy}>
            <legend className={styles.legend}>{texts.modeLegend}</legend>
            <div className={styles.modes}>
              {ONBOARDING_CLARIFICATION_MODE_VALUES.map((value) => (
                <label className={styles.mode} key={value}>
                  <input
                    aria-describedby={`${baseId}-mode-hint`}
                    checked={mode === value}
                    className={styles.radio}
                    name={`${baseId}-mode`}
                    onChange={() => setMode(value)}
                    type="radio"
                    value={value}
                  />
                  {content.mode[value]}
                </label>
              ))}
            </div>
            <p className={styles.hint} id={`${baseId}-mode-hint`}>
              {content.modeHint[mode]}
            </p>
          </fieldset>
          <FormField
            errorMessage={noteError ?? undefined}
            kind={FormFieldKind.Textarea}
            label={texts.note}
            required
            textareaProps={{
              disabled: busy,
              maxLength: QUESTIONNAIRE_LIMITS.noteMaxLength,
              onChange: (event) => {
                setNote(event.target.value);
                setNoteError(null);
              },
              rows: 3,
              value: note,
            }}
          />
          <ButtonControl
            className={styles.save}
            disabled={busy || unchangedQuestion}
            onClick={saveQuestion}
            type="button"
            variant="primary"
          >
            {busy ? texts.saving : texts.save}
          </ButtonControl>
        </div>
      ) : null}
      {failure ? (
        <p className={styles.failure} role="alert">
          {failure}
        </p>
      ) : null}
    </div>
  );
}
