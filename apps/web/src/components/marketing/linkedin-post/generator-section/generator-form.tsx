import { type ChangeEvent, type CSSProperties, type SubmitEvent } from "react";
import { PrimaryCtaButton } from "@/components/shared/button/button";
import {
  GENERATOR_COLOR_AUTO,
  GENERATOR_COLOR_PAIRS,
} from "@/common/constants/generator/generator-color-pairs";
import type { GeneratorFieldErrors } from "@/common/contracts/generator/generator-field-errors";
import type { LinkedInPostGeneratorContent } from "@/i18n/dictionaries/linkedin-post/generator";
import type { LinkedInPostGeneratorFormValues } from "@invessiv/common/contracts/generator/linkedin-post-generator-form-values";
import { Field } from "./field";
import type { GeneratorFieldIds } from "./use-field-ids";
import styles from "./generator-form.module.css";

type GeneratorFormProps = {
  content: LinkedInPostGeneratorContent;
  errors: GeneratorFieldErrors;
  fieldIds: GeneratorFieldIds;
  isSubmitting: boolean;
  onChange: <K extends keyof LinkedInPostGeneratorFormValues>(
    key: K,
    next: LinkedInPostGeneratorFormValues[K],
  ) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  values: LinkedInPostGeneratorFormValues;
};

export function GeneratorForm({
  content,
  errors,
  fieldIds,
  isSubmitting,
  onChange,
  onSubmit,
  values,
}: GeneratorFormProps) {
  const topicMax = content.form.topic.maxLength ?? 280;
  const expertiseMax = content.form.expertise.maxLength ?? 120;

  return (
    <form
      aria-label={content.title}
      className={styles.form}
      noValidate
      onSubmit={onSubmit}
    >
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

      <fieldset className={styles.toneGroup}>
        <legend className={styles.legend}>{content.form.tone.label}</legend>
        <p className={styles.legendHelp}>{content.form.tone.help}</p>
        <div className={styles.toneOptions} role="radiogroup">
          {content.form.tone.options.map((option) => {
            const isSelected = values.tone === option.value;
            return (
              <label
                className={styles.toneOption}
                data-selected={isSelected || undefined}
                key={option.value}
              >
                <input
                  checked={isSelected}
                  className={styles.toneRadio}
                  name="tone"
                  onChange={() => onChange("tone", option.value)}
                  type="radio"
                  value={option.value}
                />
                <span className={styles.toneLabel}>{option.label}</span>
                <span className={styles.toneDescription}>
                  {option.description}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className={styles.colorGroup}>
        <legend className={styles.legend}>{content.form.color.label}</legend>
        <p className={styles.legendHelp}>{content.form.color.help}</p>
        <div className={styles.swatches} role="radiogroup">
          <label
            className={styles.swatchWrap}
            data-selected={
              values.colorPairId === GENERATOR_COLOR_AUTO || undefined
            }
            title={content.form.color.autoLabel}
          >
            <input
              aria-label={content.form.color.autoLabel}
              checked={values.colorPairId === GENERATOR_COLOR_AUTO}
              className={styles.swatchInput}
              name="colorPairId"
              onChange={() => onChange("colorPairId", GENERATOR_COLOR_AUTO)}
              type="radio"
              value={GENERATOR_COLOR_AUTO}
            />
            <span aria-hidden="true" className={styles.swatchAuto} />
          </label>
          {GENERATOR_COLOR_PAIRS.map((pair) => (
            <label
              className={styles.swatchWrap}
              data-selected={values.colorPairId === pair.id || undefined}
              key={pair.id}
              title={pair.name}
            >
              <input
                aria-label={`${content.form.color.swatchLabel} ${pair.name}`}
                checked={values.colorPairId === pair.id}
                className={styles.swatchInput}
                name="colorPairId"
                onChange={() => onChange("colorPairId", pair.id)}
                type="radio"
                value={pair.id}
              />
              <span
                aria-hidden="true"
                className={styles.swatch}
                style={
                  {
                    "--swatch-from": pair.primary,
                    "--swatch-to": pair.secondary,
                    "--swatch-accent": pair.accent,
                  } as CSSProperties
                }
              >
                <span className={styles.swatchDot} />
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field
        error={errors.email}
        help={content.form.email.help}
        htmlFor={fieldIds.email}
        label={content.form.email.label}
      >
        <input
          aria-describedby={
            errors.email ? `${fieldIds.email}-error` : undefined
          }
          aria-invalid={Boolean(errors.email)}
          autoComplete="email"
          className={styles.input}
          id={fieldIds.email}
          name="email"
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onChange("email", event.target.value)
          }
          placeholder={content.form.email.placeholder}
          type="email"
          value={values.email}
        />
      </Field>

      <label
        className={styles.consent}
        data-error={Boolean(errors.consent) || undefined}
        htmlFor={fieldIds.consent}
      >
        <input
          aria-describedby={
            errors.consent ? `${fieldIds.consent}-error` : undefined
          }
          aria-invalid={Boolean(errors.consent)}
          checked={values.consent}
          className={styles.consentInput}
          id={fieldIds.consent}
          name="consent"
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onChange("consent", event.target.checked)
          }
          type="checkbox"
        />
        <span className={styles.consentBox} aria-hidden="true" />
        <span className={styles.consentText}>{content.form.consent.label}</span>
      </label>
      {errors.consent ? (
        <p className={styles.consentError} id={`${fieldIds.consent}-error`}>
          {errors.consent}
        </p>
      ) : null}

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
        disabled={isSubmitting}
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
