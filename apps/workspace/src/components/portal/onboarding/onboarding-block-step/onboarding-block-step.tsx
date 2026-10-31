"use client";

import { useEffect, useId, useRef } from "react";
import type { PortalOnboardingBlockDto } from "@invessiv/common/contracts/portal/portal-onboarding-block.dto";
import { isQuestionnaireFieldVisible } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-completeness";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { languageName } from "@invessiv/common/patterns/i18n/language-name";
import type { OnboardingFieldFormContext } from "@/common/contracts/portal/onboarding-field-form-context";
import { onboardingFieldDomId } from "@/common/patterns/portal/onboarding-field-dom-id";
import { onboardingFieldSpan } from "@/common/patterns/portal/onboarding-field-span";
import type { OnboardingFieldReadContext } from "@/common/contracts/portal/onboarding-field-read-context";
import type { OnboardingReadFiles } from "@/common/contracts/shared/onboarding-read-files";
import type { Locale } from "@/config/i18n";
import type { PortalOnboardingDictionary } from "@/i18n/dictionaries/portal";
import {
  OnboardingFieldCell,
  OnboardingFieldGrid,
} from "../onboarding-field-grid/onboarding-field-grid";
import { PortalStepHeading } from "@/components/portal/shared/portal-step-heading/portal-step-heading";
import { QuestionnaireField } from "../questionnaire-field/questionnaire-field";
import styles from "./onboarding-block-step.module.css";

export type OnboardingBlockStepProps = {
  block: PortalOnboardingBlockDto;
  content: PortalOnboardingDictionary;
  /** Commands are only provided for blocks the server allows the contact to edit. */
  editor?: OnboardingFieldFormContext;
  showLockedNotice?: boolean;
  /** How attached files open while the block is read-only. */
  files: OnboardingReadFiles | undefined;
  /** Slot to focus instead of the heading, after a jump from the list of missing answers. */
  focusFieldId: string | null;
  /** Display data for every field, independent of editing permissions. */
  form: OnboardingFieldReadContext;
  locale: Locale;
  /** Whether the step was reached by navigating; a fresh page load leaves the focus alone. */
  moveFocus: boolean;
};

/**
 * One block as one step: its title, the notes that concern it, then its visible fields. Mount it
 * with `key={block.id}`, so a step change moves the focus to the new heading.
 */
export function OnboardingBlockStep({
  block,
  content,
  editor,
  showLockedNotice = true,
  files,
  focusFieldId,
  form,
  locale,
  moveFocus,
}: OnboardingBlockStepProps) {
  const { input } = form;
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const texts = content.block;
  const fields = block.fields.filter((field) =>
    isQuestionnaireFieldVisible(field, input),
  );

  useEffect(() => {
    if (!moveFocus) return;
    const target = focusFieldId
      ? document.getElementById(onboardingFieldDomId(focusFieldId))
      : null;
    (target ?? headingRef.current)?.focus();
    // Only when the step is entered: later re-renders must not pull the focus out of a field.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section aria-labelledby={headingId} className={styles.step}>
      <PortalStepHeading id={headingId} ref={headingRef}>
        {block.title}
      </PortalStepHeading>
      {block.intro ? <p className={styles.intro}>{block.intro}</p> : null}
      {block.reviewNote ? (
        <div className={styles.review}>
          <p className={styles.reviewLabel}>{texts.reviewNote}</p>
          <p className={styles.reviewNote}>{block.reviewNote}</p>
        </div>
      ) : null}
      {block.fallbackLocale ? (
        <p className={styles.note}>
          {formatMessage(texts.fallback, {
            language: languageName(block.fallbackLocale, locale),
          })}
        </p>
      ) : null}
      {block.prefilled ? (
        <p className={styles.note}>{texts.prefilled}</p>
      ) : null}
      {!editor && showLockedNotice ? (
        <p className={styles.note}>{texts.locked}</p>
      ) : null}
      {fields.length > 0 ? (
        <div className={styles.fields}>
          <OnboardingFieldGrid>
            {fields.map((field) => (
              <OnboardingFieldCell
                key={field.id}
                span={onboardingFieldSpan(field)}
              >
                <QuestionnaireField
                  field={field}
                  form={form}
                  editor={editor}
                  files={files}
                  groupEntryId={null}
                />
              </OnboardingFieldCell>
            ))}
          </OnboardingFieldGrid>
        </div>
      ) : (
        <p className={styles.note}>{texts.empty}</p>
      )}
    </section>
  );
}
