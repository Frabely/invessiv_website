import { type ChangeEvent, type CSSProperties, type SubmitEvent } from "react";
import { PrimaryCtaButton } from "@/components/shared/button/button";
import { CustomSelect } from "@invessiv/ui";
import {
  GENERATOR_COLOR_AUTO,
  GENERATOR_COLOR_PAIRS,
} from "@/common/constants/generator/generator-color-pairs";
import type { GeneratorUsageLimit } from "@/common/contracts/generator/generator-state";
import type { GeneratorFieldErrors } from "@/common/contracts/generator/generator-field-errors";
import type { Locale } from "@/config/i18n";
import type { LinkedInPostGeneratorContent } from "@/i18n/dictionaries/linkedin-post/generator";
import type { LinkedInPostGeneratorFormValues } from "@/common/contracts/generator/linkedin-post-generator-form-values";
import { Field } from "./field";
import { UsageMeter } from "./usage-meter/usage-meter";
import type { GeneratorFieldIds } from "@/hooks/marketing/use-generator-field-ids";
import styles from "./generator-form.module.css";

type GeneratorFormProps = {
  content: LinkedInPostGeneratorContent;
  errors: GeneratorFieldErrors;
  fieldIds: GeneratorFieldIds;
  isSubmitting: boolean;
  locale: Locale;
  onChange: <K extends keyof LinkedInPostGeneratorFormValues>(
    key: K,
    next: LinkedInPostGeneratorFormValues[K],
  ) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  usageLimit?: GeneratorUsageLimit;
  values: LinkedInPostGeneratorFormValues;
};

/**
 * Anonymous generation step: creative fields only (topic, role, tone, color)
 * plus the prominent usage meter and the honeypot. Name/email are collected
 * later in the gated lead-capture step, never here.
 */
export function GeneratorForm({
  content,
  errors,
  fieldIds,
  isSubmitting,
  locale,
  onChange,
  onSubmit,
  usageLimit,
  values,
}: GeneratorFormProps) {
  const topicMax = content.form.topic.maxLength ?? 280;
  const expertiseMax = content.form.expertise.maxLength ?? 120;
  const toneOptions = content.form.tone.options;
  const hasReachedLimit = Boolean(usageLimit && usageLimit.remaining <= 0);
  const colorOptions = [
    {
      label: content.form.color.autoLabel,
      leading: <ColorPreview kind="auto" pairId={GENERATOR_COLOR_AUTO} />,
      value: GENERATOR_COLOR_AUTO,
    },
    ...GENERATOR_COLOR_PAIRS.map((pair) => ({
      ariaLabel: `${content.form.color.swatchLabel} ${pair.name}`,
      label: pair.name,
      leading: <ColorPreview kind="pair" pairId={pair.id} />,
      value: pair.id,
    })),
  ];

  return (
    <form
      aria-label={content.title}
      className={styles.form}
      noValidate
      onSubmit={onSubmit}
    >
      <UsageMeter
        content={content.usageMeter}
        locale={locale}
        usageLimit={usageLimit}
      />

      <Field
        error={errors.topic}
        help={content.form.topic.help}
        htmlFor={fieldIds.topic}
        label={content.form.topic.label}
        meta={`${values.topic.length}/${topicMax}`}
      >
        <textarea
          aria-describedby={
            errors.topic ? `${fieldIds.topic}-error` : undefined
          }
          aria-invalid={Boolean(errors.topic)}
          className={styles.textarea}
          id={fieldIds.topic}
          maxLength={topicMax}
          name="topic"
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
            onChange("topic", event.target.value)
          }
          placeholder={content.form.topic.placeholder}
          rows={3}
          value={values.topic}
        />
      </Field>

      <Field
        error={errors.expertise}
        help={content.form.expertise.help}
        htmlFor={fieldIds.expertise}
        label={content.form.expertise.label}
        meta={`${values.expertise.length}/${expertiseMax}`}
      >
        <input
          aria-describedby={
            errors.expertise ? `${fieldIds.expertise}-error` : undefined
          }
          aria-invalid={Boolean(errors.expertise)}
          autoComplete="organization-title"
          className={styles.input}
          id={fieldIds.expertise}
          maxLength={expertiseMax}
          name="expertise"
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onChange("expertise", event.target.value)
          }
          placeholder={content.form.expertise.placeholder}
          type="text"
          value={values.expertise}
        />
      </Field>

      <Field
        error={errors.tone}
        help={content.form.tone.help}
        htmlFor={fieldIds.tone}
        label={content.form.tone.label}
      >
        <CustomSelect
          describedBy={errors.tone ? `${fieldIds.tone}-error` : undefined}
          id={fieldIds.tone}
          invalid={Boolean(errors.tone)}
          onChange={(next) => onChange("tone", next)}
          options={toneOptions}
          value={values.tone}
        />
      </Field>

      <fieldset className={styles.colorGroup}>
        <legend className={styles.legend}>{content.form.color.label}</legend>
        <p className={styles.legendHelp}>{content.form.color.help}</p>
        <CustomSelect
          id={fieldIds.colorPair}
          onChange={(next) => onChange("colorPairId", next)}
          options={colorOptions}
          value={values.colorPairId}
        />
      </fieldset>

      <p className={styles.privacyNote}>{content.form.privacyNotice}</p>

      <div aria-hidden="true" className={styles.honeypot}>
        <label htmlFor={fieldIds.honeypot}>{content.form.honeypot.label}</label>
        <input
          autoComplete="off"
          id={fieldIds.honeypot}
          name="company"
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onChange("company", event.target.value)
          }
          tabIndex={-1}
          type="text"
          value={values.company}
        />
      </div>

      <PrimaryCtaButton
        className={styles.submitButton}
        data-analytics-event="cta_click"
        data-analytics-location="generator_form"
        data-analytics-target="generator"
        data-analytics-variant="primary"
        disabled={isSubmitting || hasReachedLimit}
        type="submit"
      >
        {isSubmitting ? content.form.submitLoading : content.form.submit}
      </PrimaryCtaButton>

      {isSubmitting ? (
        <p className={styles.loadingHelp} role="status">
          {content.form.loadingHelp}
        </p>
      ) : null}
    </form>
  );
}

function ColorPreview({
  kind,
  pairId,
}: {
  kind: "auto" | "pair";
  pairId: string;
}) {
  if (kind === "auto") {
    return <span aria-hidden="true" className={styles.swatchAuto} />;
  }

  const pair = GENERATOR_COLOR_PAIRS.find(
    (candidate) => candidate.id === pairId,
  );
  return (
    <span
      aria-hidden="true"
      className={styles.swatch}
      style={
        {
          "--swatch-from": pair?.primary,
          "--swatch-to": pair?.secondary,
          "--swatch-accent": pair?.accent,
        } as CSSProperties
      }
    >
      <span className={styles.swatchDot} />
    </span>
  );
}
