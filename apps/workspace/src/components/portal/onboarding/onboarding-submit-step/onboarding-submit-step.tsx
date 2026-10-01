"use client";

import { useEffect, useRef, useState } from "react";
import type { QuestionnaireProgressDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-progress.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl, ConfirmDialog, PrimaryCtaButton } from "@invessiv/ui";
import type { OnboardingMissingAnswer } from "@/common/contracts/portal/onboarding-missing-answer";
import { onboardingAnswerDrafts } from "@/common/patterns/portal/onboarding-answer-drafts";
import { OnboardingProgressBar } from "@/components/shared/onboarding/onboarding-progress-bar/onboarding-progress-bar";
import type { PortalOnboardingDictionary } from "@/i18n/dictionaries/portal";
import styles from "./onboarding-submit-step.module.css";

export type OnboardingSubmitStepProps = {
  /** True while the pending saves are flushed and the submission runs. */
  busy: boolean;
  content: PortalOnboardingDictionary;
  /** Why the last attempt did not go through, already worded. */
  error: string | null;
  missing: readonly OnboardingMissingAnswer[];
  /** Whether the step was reached by navigating; a fresh page load leaves the focus alone. */
  moveFocus: boolean;
  onJumpAction: (answer: OnboardingMissingAnswer) => void;
  /** Resolves once the attempt is over, whatever its outcome. */
  onSubmitAction: () => Promise<void>;
  progress: QuestionnaireProgressDto;
};

/**
 * The last step: what is still missing, each entry a jump to its field, and the submission with
 * a last confirmation. Submitting stays closed while a required answer is missing.
 */
export function OnboardingSubmitStep({
  busy,
  content,
  error,
  missing,
  moveFocus,
  onJumpAction,
  onSubmitAction,
  progress,
}: OnboardingSubmitStepProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [confirming, setConfirming] = useState(false);
  const texts = content.submit;

  useEffect(() => {
    if (moveFocus) headingRef.current?.focus();
    // Only when the step is entered.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit() {
    await onSubmitAction();
    setConfirming(false);
  }

  return (
    <section className={styles.step}>
      <h2 className={styles.title} ref={headingRef} tabIndex={-1}>
        {texts.heading}
      </h2>
      <p className={styles.text}>{texts.intro}</p>
      <OnboardingProgressBar progress={progress} texts={content.progress} />
      {missing.length > 0 ? (
        <div className={styles.missing}>
          <h3 className={styles.missingTitle}>{texts.missingHeading}</h3>
          <ul className={styles.list}>
            {missing.map((answer) => (
              <li
                key={onboardingAnswerDrafts.slotKey(
                  answer.fieldId,
                  answer.groupEntryId,
                )}
              >
                {/* A button, not a link: the jump stays on the page and must not ask to leave it. */}
                <ButtonControl
                  className={styles.jump}
                  onClick={() => onJumpAction(answer)}
                  type="button"
                  variant="ghost"
                >
                  {formatMessage(texts.missingItem, {
                    field: answer.fieldLabel,
                    block: answer.blockTitle,
                  })}
                </ButtonControl>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className={styles.complete}>{texts.complete}</p>
      )}
      <p className={styles.text}>{texts.lockNotice}</p>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      <div>
        <PrimaryCtaButton
          disabled={missing.length > 0 || busy}
          onClick={() => setConfirming(true)}
          type="button"
        >
          {texts.action}
        </PrimaryCtaButton>
      </div>
      {confirming ? (
        <ConfirmDialog
          busy={busy}
          cancelLabel={content.submitDialog.cancel}
          closeLabel={content.submitDialog.close}
          confirmLabel={content.submitDialog.confirm}
          description={content.submitDialog.description}
          onCancelAction={() => setConfirming(false)}
          onConfirmAction={() => void submit()}
          title={content.submitDialog.title}
        />
      ) : null}
    </section>
  );
}
