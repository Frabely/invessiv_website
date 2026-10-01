"use client";

import { useRouter } from "next/navigation";
import { type SubmitEvent, useId, useState } from "react";
import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import type { QuestionnaireTemplateSummaryDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-template-summary.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { CustomSelect, FormDialog, FormField } from "@invessiv/ui";
import { onboardingFormApiService } from "@/client/crm/onboarding-form-api-service";
import type { OnboardingFormErrorTexts } from "@/common/contracts/crm/onboarding/onboarding-form-error-texts";
import { onboardingFormErrorText } from "@/common/patterns/crm/onboarding/onboarding-form-error-text";
import type { Locale } from "@/config/i18n";
import type { CrmOnboardingDictionary } from "@/i18n/dictionaries/workspace/crm";
import { crmOnboardingFormPathFor } from "@/lib/auth/routes";
import styles from "./onboarding-start-dialog.module.css";

export type OnboardingStartDialogProps = {
  content: CrmOnboardingDictionary["project"]["dialog"];
  errorTexts: OnboardingFormErrorTexts;
  locale: Locale;
  onCloseAction: () => void;
  /** Whether the customer has a completed form whose company-wide answers are taken over. */
  prefillAvailable: boolean;
  projectId: string;
  /** Active templates only; the server refuses an archived one anyway. */
  templates: readonly QuestionnaireTemplateSummaryDto[];
};

// Stands for "no template" in the select; template ids are UUIDs and never collide with it.
const BLANK = "blank";

/** Picks a template or an empty start; the new draft opens on its own page for adjusting. */
export function OnboardingStartDialog({
  content,
  errorTexts,
  locale,
  onCloseAction,
  prefillAvailable,
  projectId,
  templates,
}: OnboardingStartDialogProps) {
  const router = useRouter();
  const formId = useId();
  const selectId = useId();
  const [choice, setChoice] = useState(templates[0]?.id ?? BLANK);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const blank = choice === BLANK;

  async function start(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setFailure(null);
    const result = await onboardingFormApiService.start(projectId, {
      templateId: blank ? null : choice,
    });
    if (result.ok) {
      router.push(crmOnboardingFormPathFor(locale, result.value.id));
      return;
    }
    setBusy(false);
    // Starting compares no version, so a conflict can only be an unexpected answer.
    setFailure(
      onboardingFormErrorText(
        "current" in result ? OnboardingErrorCode.Internal : result.code,
        errorTexts,
      ),
    );
  }

  return (
    <FormDialog
      busy={busy}
      cancelLabel={content.cancel}
      closeLabel={content.close}
      description={content.description}
      formId={formId}
      onCloseAction={onCloseAction}
      submitLabel={content.submit}
      submittingLabel={content.submitting}
      title={content.title}
    >
      <form className={styles.form} id={formId} noValidate onSubmit={start}>
        {failure ? (
          <p className={styles.failure} role="alert">
            {failure}
          </p>
        ) : null}
        <FormField
          controlId={selectId}
          hint={
            templates.length === 0
              ? content.noTemplates
              : blank
                ? content.blankHint
                : content.templateHint
          }
          kind={FormFieldKind.Custom}
          label={content.template}
          renderControl={({ describedBy, id }) => (
            <CustomSelect
              describedBy={describedBy}
              disabled={busy}
              id={id}
              onChange={setChoice}
              options={[
                ...templates.map((template) => ({
                  label: formatMessage(
                    template.blockCount === 1
                      ? content.templateOptionOne
                      : content.templateOption,
                    { title: template.title, count: template.blockCount },
                  ),
                  value: template.id,
                })),
                { label: content.blank, value: BLANK },
              ]}
              value={choice}
            />
          )}
        />
        {prefillAvailable && !blank ? (
          <p className={styles.note}>{content.prefillHint}</p>
        ) : null}
      </form>
    </FormDialog>
  );
}
