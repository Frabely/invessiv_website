"use client";

import { OnboardingClarificationMode } from "@invessiv/common/constants/crm/onboarding/onboarding-clarification-modes";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import { listOnboardingClarificationBlocks } from "@invessiv/common/patterns/crm/onboarding/onboarding-review";
import { ConfirmDialog, LinkedText } from "@invessiv/ui";
import { onboardingFormApiService } from "@/client/crm/onboarding-form-api-service";
import type { OnboardingFormClientErrorCode } from "@/common/constants/crm/onboarding/onboarding-form-client-error-codes";
import type { OnboardingFormErrorTexts } from "@/common/contracts/crm/onboarding/onboarding-form-error-texts";
import { onboardingFormErrorText } from "@/common/patterns/crm/onboarding/onboarding-form-error-text";
import { questionnaireBlockName } from "@/common/patterns/crm/questionnaire/questionnaire-display-name";
import type { Locale } from "@/config/i18n";
import { useVersionedMutation } from "@/hooks/workspace/use-versioned-mutation";
import type { CrmOnboardingDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./onboarding-request-changes-dialog.module.css";

export type OnboardingRequestChangesDialogProps = {
  content: CrmOnboardingDictionary["review"]["request"]["dialog"];
  errorTexts: OnboardingFormErrorTexts;
  /** The submitted form as the page holds it; its version guards the request. */
  form: OnboardingFormDto;
  locale: Locale;
  onCloseAction: () => void;
  /** A stale version came back with the current form; the page adopts it and the dialog stays. */
  onConflictAction: (current: OnboardingFormDto) => void;
  onRequestedAction: (form: OnboardingFormDto) => void;
};

/**
 * The last look before a form goes back to the customer: exactly the blocks that open again in
 * the portal, each with the question the customer will read there.
 */
export function OnboardingRequestChangesDialog({
  content,
  errorTexts,
  form,
  locale,
  onCloseAction,
  onConflictAction,
  onRequestedAction,
}: OnboardingRequestChangesDialogProps) {
  const mutation = useVersionedMutation<
    OnboardingFormDto,
    OnboardingFormClientErrorCode
  >(form, onCloseAction, { onConflictAction });
  const busy = mutation.isSubmitting;
  const failure = mutation.hasConflict
    ? content.conflict
    : mutation.errorCode
      ? onboardingFormErrorText(mutation.errorCode, errorTexts)
      : null;
  const requested = listOnboardingClarificationBlocks(
    form.blocks,
    OnboardingClarificationMode.Customer,
  );

  async function request() {
    if (busy) return;
    await mutation.submit(async (current) => {
      const result = await onboardingFormApiService.requestChanges(current.id, {
        expectedVersion: current.version,
      });
      if (!result.ok) return result;
      onRequestedAction(result.value);
      return { ok: true, current: result.value };
    });
  }

  return (
    <ConfirmDialog
      busy={busy}
      cancelLabel={content.cancel}
      closeLabel={content.close}
      confirmLabel={content.confirm}
      description={content.description}
      onCancelAction={mutation.close}
      onConfirmAction={() => void request()}
      title={content.title}
    >
      <div className={styles.requested}>
        <p className={styles.heading}>{content.listHeading}</p>
        <ul className={styles.list}>
          {requested.map((step) => (
            <li key={step.block.id}>
              <span className={styles.block}>
                {questionnaireBlockName(step.block, locale)}
              </span>
              <span className={styles.note}>
                <LinkedText text={step.reviewNote ?? ""} />
              </span>
            </li>
          ))}
        </ul>
      </div>
      {failure ? (
        <p className={styles.failure} role="alert">
          {failure}
        </p>
      ) : null}
    </ConfirmDialog>
  );
}
