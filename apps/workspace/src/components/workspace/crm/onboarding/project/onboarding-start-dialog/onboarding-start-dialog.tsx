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
  mode?: "start";
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

export type OnboardingTemplateApplyDialogProps = {
  applyTexts: CrmOnboardingDictionary["structure"]["templateDialog"];
  busy: boolean;
  content: CrmOnboardingDictionary["project"]["dialog"];
  failure: string | null;
  mode: "apply";
  onApplyAction: (templateId: string) => Promise<boolean>;
  onCloseAction: () => void;
  templates: readonly QuestionnaireTemplateSummaryDto[];
};

// Stands for "no template" in the select; template ids are UUIDs and never collide with it.
const BLANK = "blank";

/** Picks a template or an empty start; the new draft opens on its own page for adjusting. */
export function OnboardingStartDialog(
  props: OnboardingStartDialogProps | OnboardingTemplateApplyDialogProps,
) {
  const { content, onCloseAction, templates } = props;
  const applying = props.mode === "apply";
  const router = useRouter();
  const formId = useId();
  const selectId = useId();
  const [choice, setChoice] = useState(
    applying ? "" : (templates[0]?.id ?? BLANK),
  );
  const [submitting, setSubmitting] = useState(false);
  const [startFailure, setStartFailure] = useState<string | null>(null);
  const busy = submitting || (applying && props.busy);
  const failure = applying ? props.failure : startFailure;
  const blank = choice === BLANK;

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || (applying && !choice)) return;
    setSubmitting(true);
    if (applying) {
      await props.onApplyAction(choice);
      setSubmitting(false);
      return;
    }
    setStartFailure(null);
    const result = await onboardingFormApiService.start(props.projectId, {
      templateId: blank ? null : choice,
    });
    if (result.ok) {
      router.push(crmOnboardingFormPathFor(props.locale, result.value.id));
      return;
    }
    setSubmitting(false);
    // Starting compares no version, so a conflict can only be an unexpected answer.
    setStartFailure(
      onboardingFormErrorText(
        "current" in result ? OnboardingErrorCode.Internal : result.code,
        props.errorTexts,
      ),
    );
  }

  const submitLabel = applying ? props.applyTexts.apply : content.submit;
  const submittingLabel = applying
    ? props.applyTexts.applying
    : content.submitting;

  return (
    <FormDialog
      busy={busy}
      cancelLabel={applying ? props.applyTexts.cancel : content.cancel}
      closeLabel={applying ? props.applyTexts.cancel : content.close}
      description={
        applying ? props.applyTexts.description : content.description
      }
      formId={formId}
      onCloseAction={onCloseAction}
      submitDisabled={applying && !choice}
      submitLabel={submitLabel}
      submittingLabel={submittingLabel}
      title={applying ? props.applyTexts.title : content.title}
    >
      <form className={styles.form} id={formId} noValidate onSubmit={submit}>
        {failure ? (
          <p className={styles.failure} role="alert">
            {failure}
          </p>
        ) : null}
        <FormField
          controlId={selectId}
          hint={
            applying
              ? content.templateHint
              : templates.length === 0
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
                ...(applying
                  ? [{ label: props.applyTexts.placeholder, value: "" }]
                  : []),
                ...templates.map((template) => ({
                  label: formatMessage(
                    template.blockCount === 1
                      ? content.templateOptionOne
                      : content.templateOption,
                    { title: template.title, count: template.blockCount },
                  ),
                  value: template.id,
                })),
                ...(!applying ? [{ label: content.blank, value: BLANK }] : []),
              ]}
              value={choice}
            />
          )}
        />
        {!applying && props.prefillAvailable && !blank ? (
          <p className={styles.note}>{content.prefillHint}</p>
        ) : null}
      </form>
    </FormDialog>
  );
}
