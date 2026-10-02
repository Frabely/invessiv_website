"use client";

import { useState } from "react";
import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { OnboardingReleaseWarningKind } from "@invessiv/common/constants/crm/onboarding/onboarding-release-warning-kinds";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { OnboardingReleaseWarningDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-release-warning.dto";
import { isOnboardingFormReleasable } from "@invessiv/common/patterns/crm/onboarding/onboarding-release-check";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { languageName } from "@invessiv/common/patterns/i18n/language-name";
import { ConfirmDialog, Dialog, DialogSize } from "@invessiv/ui";
import { onboardingFormApiService } from "@/client/crm/onboarding-form-api-service";
import type { OnboardingFormClientErrorCode } from "@/common/constants/crm/onboarding/onboarding-form-client-error-codes";
import type { OnboardingFormErrorTexts } from "@/common/contracts/crm/onboarding/onboarding-form-error-texts";
import { onboardingFormErrorText } from "@/common/patterns/crm/onboarding/onboarding-form-error-text";
import { questionnaireBlockName } from "@/common/patterns/crm/questionnaire/questionnaire-display-name";
import type { Locale } from "@/config/i18n";
import { useVersionedMutation } from "@/hooks/workspace/use-versioned-mutation";
import type { CrmOnboardingDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./onboarding-release-dialog.module.css";

export type OnboardingReleaseDialogProps = {
  content: CrmOnboardingDictionary["release"]["dialog"];
  errorTexts: OnboardingFormErrorTexts;
  /** The draft as the page holds it; its version guards the release. */
  form: OnboardingFormDto;
  locale: Locale;
  onCloseAction: () => void;
  /** A stale version came back with the current form; the page adopts it and the dialog stays. */
  onConflictAction: (current: OnboardingFormDto) => void;
  onReleasedAction: (released: OnboardingFormDto) => void;
};

/**
 * Releases a draft to the portal. A form that asks nothing is explained instead of sent. Warnings
 * the server finds are named one by one, and only a second, deliberate confirmation releases in
 * spite of them.
 */
export function OnboardingReleaseDialog({
  content,
  errorTexts,
  form,
  locale,
  onCloseAction,
  onConflictAction,
  onReleasedAction,
}: OnboardingReleaseDialogProps) {
  const mutation = useVersionedMutation<
    OnboardingFormDto,
    OnboardingFormClientErrorCode
  >(form, onCloseAction, { onConflictAction });
  const busy = mutation.isSubmitting;
  /** Null until the server named warnings; from then on the confirmation acknowledges them. */
  const [warnings, setWarnings] = useState<
    readonly OnboardingReleaseWarningDto[] | null
  >(null);
  const blocks = form.blocks.map((step) => step.block);

  if (!isOnboardingFormReleasable(blocks))
    return (
      <Dialog
        closeLabel={content.close}
        onCloseAction={onCloseAction}
        size={DialogSize.Narrow}
        title={content.title}
      >
        <p className={styles.text}>{content.notReleasable}</p>
      </Dialog>
    );

  async function release() {
    if (busy) return;
    await mutation.submit(async (current) => {
      const result = await onboardingFormApiService.release(current.id, {
        expectedVersion: current.version,
        acknowledgeWarnings: warnings !== null,
      });
      if (result.ok) {
        onReleasedAction(result.value);
        return { ok: true, current: result.value };
      }
      if ("warnings" in result) {
        setWarnings(result.warnings);
        return { ok: false, code: result.code };
      }
      // What was acknowledged belonged to the old version; the new one is checked afresh.
      if ("current" in result) setWarnings(null);
      return result;
    });
  }

  function describeFailure(): string | null {
    if (mutation.hasConflict) return content.conflict;
    const code = mutation.errorCode;
    // Warnings wait for their acknowledgement in the list above; they are no failure.
    if (code === null || code === OnboardingErrorCode.ReleaseWarnings)
      return null;
    // The server found the form empty after all, e.g. after a colleague removed a field.
    return code === QuestionnaireErrorCode.InvalidFieldConfig
      ? content.notReleasable
      : onboardingFormErrorText(code, errorTexts);
  }

  function describe(warning: OnboardingReleaseWarningDto): string {
    if (warning.kind === OnboardingReleaseWarningKind.NoPortalAccess)
      return content.warnings.no_portal_access;
    const block = blocks.find((entry) => entry.id === warning.blockId);
    return formatMessage(content.warnings.missing_translation, {
      block: block
        ? questionnaireBlockName(block, locale)
        : content.unknownBlock,
      language: languageName(warning.locale, locale),
    });
  }

  const failure = describeFailure();

  return (
    <ConfirmDialog
      busy={busy}
      cancelLabel={content.cancel}
      closeLabel={content.close}
      confirmLabel={warnings ? content.confirmAnyway : content.confirm}
      description={content.description}
      onCancelAction={mutation.close}
      onConfirmAction={() => void release()}
      title={content.title}
    >
      {warnings && warnings.length > 0 ? (
        <div className={styles.warnings}>
          <p className={styles.heading}>{content.warningsHeading}</p>
          <ul className={styles.list}>
            {warnings.map((warning) => (
              <li
                key={
                  warning.kind === OnboardingReleaseWarningKind.NoPortalAccess
                    ? warning.kind
                    : `${warning.blockId}:${warning.locale}`
                }
              >
                {describe(warning)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {failure ? (
        <p className={styles.failure} role="alert">
          {failure}
        </p>
      ) : null}
    </ConfirmDialog>
  );
}
