"use client";

import Link from "next/link";
import { type SubmitEvent, useId, useState } from "react";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import { isOnboardingCallDateAcceptable } from "@invessiv/common/patterns/crm/onboarding/onboarding-form-state";
import { summarizeOnboardingReview } from "@invessiv/common/patterns/crm/onboarding/onboarding-review";
import { findQuestionnaireField } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-block-structure";
import { toOnboardingCompletenessInput } from "@invessiv/common/patterns/crm/onboarding/onboarding-completeness-input";
import { getQuestionnaireCompleteness } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-completeness";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import {
  ButtonControl,
  CheckboxControl,
  Dialog,
  DialogSize,
  FormField,
  PrimaryCtaButton,
} from "@invessiv/ui";
import { onboardingFormApiService } from "@/client/crm/onboarding-form-api-service";
import type { OnboardingFormClientErrorCode } from "@/common/constants/crm/onboarding/onboarding-form-client-error-codes";
import type { OnboardingFormErrorTexts } from "@/common/contracts/crm/onboarding/onboarding-form-error-texts";
import { onboardingFormErrorText } from "@/common/patterns/crm/onboarding/onboarding-form-error-text";
import {
  questionnaireBlockName,
  questionnaireFieldName,
} from "@/common/patterns/crm/questionnaire/questionnaire-display-name";
import { businessToday } from "@/common/patterns/time/business-today";
import type { Locale } from "@/config/i18n";
import { useVersionedMutation } from "@/hooks/workspace/use-versioned-mutation";
import type { CrmOnboardingDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./onboarding-complete-dialog.module.css";

export type OnboardingCompleteDialogProps = {
  /** The answers tab of this form, where the missing required answers can be looked up. */
  answersHref: string;
  content: CrmOnboardingDictionary["complete"]["dialog"];
  errorTexts: OnboardingFormErrorTexts;
  /** The submitted form as the page holds it; its version guards the completion. */
  form: OnboardingFormDto;
  locale: Locale;
  onCloseAction: () => void;
  onCompletedAction: (completed: OnboardingFormDto) => void;
  /** A stale version came back with the current form; the page adopts it and the dialog stays. */
  onConflictAction: (current: OnboardingFormDto) => void;
  /** The project is still in its onboarding phase, so the completion can move it on. */
  phaseAdvanceable: boolean;
};

/**
 * The last step of an onboarding. Only two things hold it up: a missing required answer and the
 * day of the call. Everything else the team might want to know first — unreviewed blocks, points
 * left on the call agenda — is named but never blocks. Completeness and review numbers come from
 * the same functions the server and the form head use.
 */
export function OnboardingCompleteDialog({
  answersHref,
  content,
  errorTexts,
  form,
  locale,
  onCloseAction,
  onCompletedAction,
  onConflictAction,
  phaseAdvanceable,
}: OnboardingCompleteDialogProps) {
  const formId = useId();
  const advanceId = useId();
  const mutation = useVersionedMutation<
    OnboardingFormDto,
    OnboardingFormClientErrorCode
  >(form, onCloseAction, { onConflictAction });
  const [callHeldOn, setCallHeldOn] = useState("");
  const [advancePhase, setAdvancePhase] = useState(true);
  const [dateError, setDateError] = useState<string | null>(null);
  const busy = mutation.isSubmitting;
  const failure = mutation.hasConflict
    ? content.conflict
    : mutation.errorCode
      ? onboardingFormErrorText(mutation.errorCode, errorTexts)
      : null;
  const today = businessToday();
  const blocks = form.blocks.map((step) => step.block);
  const { missing } = getQuestionnaireCompleteness(
    toOnboardingCompletenessInput(form),
  );
  // A sub-field missing in several group entries is one thing to ask for, not several.
  const missingFieldIds = [...new Set(missing.map((entry) => entry.fieldId))];
  const review = summarizeOnboardingReview(form.blocks);
  const unreviewed = review.total - review.reviewed;
  const hints = [
    unreviewed > 0
      ? formatMessage(
          unreviewed === 1 ? content.unreviewedOne : content.unreviewed,
          { count: unreviewed },
        )
      : null,
    review.callClarifications > 0
      ? formatMessage(
          review.callClarifications === 1
            ? content.callPointsOne
            : content.callPoints,
          { count: review.callClarifications },
        )
      : null,
  ].filter((hint) => hint !== null);

  function describeMissing(fieldId: string): string {
    const block = blocks.find((entry) =>
      findQuestionnaireField(entry, fieldId),
    );
    const field = block ? findQuestionnaireField(block, fieldId) : undefined;
    return formatMessage(content.missingItem, {
      field: field
        ? questionnaireFieldName(field, locale, content.untitledField)
        : content.untitledField,
      block: block ? questionnaireBlockName(block, locale) : "",
    });
  }

  async function complete(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || missingFieldIds.length > 0) return;
    if (!isOnboardingCallDateAcceptable(callHeldOn, today)) {
      setDateError(
        callHeldOn === ""
          ? content.callHeldOnRequired
          : content.callHeldOnFuture,
      );
      return;
    }
    await mutation.submit(async (current) => {
      const result = await onboardingFormApiService.complete(current.id, {
        expectedVersion: current.version,
        callHeldOn,
        advancePhase: phaseAdvanceable && advancePhase,
      });
      if (!result.ok) return result;
      onCompletedAction(result.value);
      return { ok: true, current: result.value };
    });
  }

  return (
    <Dialog
      busy={busy}
      closeLabel={content.close}
      description={content.description}
      footer={
        <>
          <ButtonControl
            disabled={busy}
            onClick={mutation.close}
            type="button"
            variant="ghost"
          >
            {content.cancel}
          </ButtonControl>
          <PrimaryCtaButton
            disabled={busy || missingFieldIds.length > 0}
            form={formId}
            type="submit"
          >
            {busy ? content.confirming : content.confirm}
          </PrimaryCtaButton>
        </>
      }
      onCloseAction={mutation.close}
      size={DialogSize.Narrow}
      title={content.title}
    >
      <form className={styles.form} id={formId} noValidate onSubmit={complete}>
        {failure ? (
          <p className={styles.failure} role="alert">
            {failure}
          </p>
        ) : null}
        {missingFieldIds.length > 0 ? (
          <div className={styles.missing}>
            <p className={styles.heading}>{content.missingHeading}</p>
            <ul className={styles.list}>
              {missingFieldIds.map((fieldId) => (
                <li key={fieldId}>{describeMissing(fieldId)}</li>
              ))}
            </ul>
            <p className={styles.note}>{content.missingHint}</p>
            <Link
              className={styles.link}
              href={answersHref}
              onClick={mutation.close}
            >
              {content.missingLink}
            </Link>
          </div>
        ) : null}
        <FormField
          errorMessage={dateError ?? undefined}
          hint={content.callHeldOnHint}
          inputProps={{
            disabled: busy,
            max: today,
            name: "onboarding-call-held-on",
            onChange: (event) => {
              setCallHeldOn(event.target.value);
              setDateError(null);
            },
            value: callHeldOn,
          }}
          kind={FormFieldKind.Date}
          label={content.callHeldOn}
          required
        />
        {phaseAdvanceable ? (
          <div className={styles.advance}>
            <label className={styles.check} htmlFor={advanceId}>
              <CheckboxControl
                aria-describedby={`${advanceId}-hint`}
                checked={advancePhase}
                disabled={busy}
                id={advanceId}
                onChange={(event) => setAdvancePhase(event.target.checked)}
              />
              <span>{content.advancePhase}</span>
            </label>
            <p className={styles.checkHint} id={`${advanceId}-hint`}>
              {content.advancePhaseHint}
            </p>
          </div>
        ) : null}
        {hints.length > 0 ? (
          <div className={styles.hints}>
            <p className={styles.heading}>{content.hintsHeading}</p>
            <ul className={styles.list}>
              {hints.map((hint) => (
                <li key={hint}>{hint}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </form>
    </Dialog>
  );
}
