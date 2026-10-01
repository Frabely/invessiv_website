"use client";

import { useEffect, useRef } from "react";
import type { PortalOnboardingBlockDto } from "@invessiv/common/contracts/portal/portal-onboarding-block.dto";
import { isQuestionnaireFieldVisible } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-completeness";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { languageName } from "@invessiv/common/patterns/i18n/language-name";
import { onboardingFieldDomId } from "@/common/patterns/portal/onboarding-field-dom-id";
import {
  OnboardingAnswerReadView,
  type OnboardingAnswerReadViewProps,
} from "@/components/shared/onboarding/onboarding-answer-read-view/onboarding-answer-read-view";
import type { Locale } from "@/config/i18n";
import type { PortalOnboardingDictionary } from "@/i18n/dictionaries/portal";
import {
  QuestionnaireField,
  type QuestionnaireFieldProps,
} from "../questionnaire-field/questionnaire-field";
import styles from "./onboarding-block-step.module.css";

export type OnboardingBlockStepProps = {
  block: PortalOnboardingBlockDto;
  content: PortalOnboardingDictionary;
  /** False during a change request for blocks the team did not hand back. */
  editable: boolean;
  /** How attached files open while the block is read-only. */
  files: OnboardingAnswerReadViewProps["files"];
  /** Slot to focus instead of the heading, after a jump from the list of missing answers. */
  focusFieldId: string | null;
  /** What every field of the step reads from and writes to. */
  form: QuestionnaireFieldProps["form"];
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
  editable,
  files,
  focusFieldId,
  form,
  locale,
  moveFocus,
}: OnboardingBlockStepProps) {
  const { input } = form;
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
    <section className={styles.step}>
      <h2 className={styles.title} ref={headingRef} tabIndex={-1}>
        {block.title}
      </h2>
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
      {editable ? (
        fields.length > 0 ? (
          <div className={styles.fields}>
            {fields.map((field) => (
              <QuestionnaireField
                field={field}
                form={form}
                groupEntryId={null}
                key={field.id}
              />
            ))}
          </div>
        ) : (
          <p className={styles.note}>{texts.empty}</p>
        )
      ) : (
        <>
          <p className={styles.note}>{texts.locked}</p>
          <OnboardingAnswerReadView
            answerFiles={form.answerFiles}
            answers={input.answers}
            blocks={[block]}
            files={files}
            groupEntries={input.groupEntries}
            services={form.services}
            servicesConfirmed={input.servicesConfirmed}
            servicesNote={form.servicesNote}
            showBlockTitles={false}
            texts={content.read}
          />
        </>
      )}
    </section>
  );
}
