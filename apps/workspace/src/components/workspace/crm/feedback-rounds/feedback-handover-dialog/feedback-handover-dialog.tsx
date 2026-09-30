"use client";

import { type SubmitEvent, useId, useRef, useState } from "react";
import { FeedbackRoundErrorCode } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import {
  FEEDBACK_HAND_OVER_BLOCKER_VALUES,
  type FeedbackHandOverBlocker,
} from "@invessiv/common/constants/crm/feedback-hand-over-blockers";
import { FEEDBACK_LIMITS } from "@invessiv/common/constants/crm/feedback-limits";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { FormDialog, FormField } from "@invessiv/ui";
import { feedbackRoundsApiService } from "@/client/crm/feedback-rounds-api-service";
import type { FeedbackHandoverFormErrors } from "@/common/contracts/crm/feedback-handover-form-errors";
import type { FeedbackHandoverFormValues } from "@/common/contracts/crm/feedback-handover-form-values";
import type { HandOverFeedbackRoundClientResult } from "@/common/contracts/crm/feedback-round-client-result";
import {
  createFeedbackHandoverValues,
  toHandOverRequest,
  validateFeedbackHandover,
} from "@/common/patterns/crm/feedback-handover-form";
import { businessToday } from "@/common/patterns/time/business-today";
import type { CrmFeedbackRoundsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { FeedbackAreaChips } from "../feedback-area-chips/feedback-area-chips";
import styles from "./feedback-handover-dialog.module.css";

type FeedbackHandoverDialogProps = {
  content: CrmFeedbackRoundsDictionary;
  projectId: string;
  roundNumber: number;
  included: number;
  defaultPreviewUrl: string | null;
  feedbackAreas: readonly string[];
  onCloseAction: () => void;
  /** Called with the new round, or with the running one after a double handover. */
  onHandedOverAction: (roundId: string, alreadyRunning: boolean) => void;
};

function isBlocker(code: string): code is FeedbackHandOverBlocker {
  return (FEEDBACK_HAND_OVER_BLOCKER_VALUES as readonly string[]).includes(
    code,
  );
}

function errorMessage(
  result: Exclude<HandOverFeedbackRoundClientResult, { ok: true }>,
  content: CrmFeedbackRoundsDictionary,
  numbers: { number: number; included: number },
): string {
  if (isBlocker(result.code))
    return formatMessage(content.blockers[result.code], numbers);
  if (result.code === FeedbackRoundErrorCode.ValidationError)
    return content.handover.errors.validation;
  if (result.code === FeedbackRoundErrorCode.ProjectNotFound)
    return content.handover.errors.notFound;
  return content.handover.errors.internal;
}

/** Hands round n over: preview, what is new, a due day and the areas the customer picks from. */
export function FeedbackHandoverDialog({
  content,
  projectId,
  roundNumber,
  included,
  defaultPreviewUrl,
  feedbackAreas,
  onCloseAction,
  onHandedOverAction,
}: FeedbackHandoverDialogProps) {
  const formId = useId();
  const previewRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<FeedbackHandoverFormValues>(() =>
    createFeedbackHandoverValues({
      previewUrl: defaultPreviewUrl,
      areaOptions: feedbackAreas,
    }),
  );
  const [errors, setErrors] = useState<FeedbackHandoverFormErrors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const texts = content.handover;

  function update<K extends keyof FeedbackHandoverFormValues>(
    key: K,
    value: FeedbackHandoverFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const validation = validateFeedbackHandover(values, businessToday());
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;
    setBusy(true);
    setFailure(null);
    const result = await feedbackRoundsApiService.handOver(
      projectId,
      toHandOverRequest(values),
    );
    if (result.ok) {
      onHandedOverAction(result.roundId, false);
      return;
    }
    if ("activeRoundId" in result) {
      onHandedOverAction(result.activeRoundId, true);
      return;
    }
    setBusy(false);
    setFailure(
      errorMessage(result, content, { number: roundNumber, included }),
    );
  }

  return (
    <FormDialog
      busy={busy}
      cancelLabel={texts.cancel}
      closeLabel={texts.close}
      description={texts.description}
      formId={formId}
      initialFocusRef={previewRef}
      onCloseAction={onCloseAction}
      submitLabel={texts.submit}
      submittingLabel={texts.submitting}
      title={formatMessage(texts.title, { number: roundNumber })}
    >
      <form
        className={styles.form}
        id={formId}
        noValidate
        onSubmit={handleSubmit}
      >
        {failure ? (
          <p className={styles.failure} role="alert">
            {failure}
          </p>
        ) : null}
        <FormField
          errorMessage={
            errors.previewUrl ? texts.validation[errors.previewUrl] : undefined
          }
          hint={texts.previewUrlHint}
          inputProps={{
            maxLength: FEEDBACK_LIMITS.previewUrlMaxLength,
            name: "feedback-preview-url",
            onChange: (event) => update("previewUrl", event.target.value),
            placeholder: texts.previewUrlPlaceholder,
            value: values.previewUrl,
          }}
          inputRef={previewRef}
          kind={FormFieldKind.Url}
          label={texts.previewUrl}
        />
        <FormField
          kind={FormFieldKind.Textarea}
          label={texts.handoverNote}
          textareaProps={{
            maxLength: FEEDBACK_LIMITS.noteMaxLength,
            name: "feedback-handover-note",
            onChange: (event) => update("handoverNote", event.target.value),
            placeholder: texts.handoverNotePlaceholder,
            rows: 3,
            value: values.handoverNote,
          }}
        />
        <FormField
          errorMessage={
            errors.dueOn ? texts.validation[errors.dueOn] : undefined
          }
          hint={texts.dueOnHint}
          inputProps={{
            min: businessToday(),
            name: "feedback-due-on",
            onChange: (event) => update("dueOn", event.target.value),
            value: values.dueOn,
          }}
          kind={FormFieldKind.Date}
          label={texts.dueOn}
        />
        <FeedbackAreaChips
          areas={values.areaOptions}
          content={texts}
          disabled={busy}
          onChangeAction={(areas) => update("areaOptions", areas)}
        />
      </form>
    </FormDialog>
  );
}
