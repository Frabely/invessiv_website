import { type ChangeEvent, type CSSProperties, type SubmitEvent } from "react";
import { PrimaryCtaButton } from "@/components/shared/button/button";
import { CustomSelect } from "@invessiv/ui";
import {
  GENERATOR_COLOR_AUTO,
  GENERATOR_COLOR_PAIRS,
} from "@/common/constants/generator/generator-color-pairs";
import { GeneratorStateKind } from "@/common/constants/generator/generator-state-kind";
import type { GeneratorState } from "@/common/contracts/generator/generator-state";
import type { GeneratorFieldErrors } from "@/common/contracts/generator/generator-field-errors";
import type { LinkedInPostGeneratorContent } from "@/i18n/dictionaries/linkedin-post/generator";
import type { LinkedInPostGeneratorFormValues } from "@/common/contracts/generator/linkedin-post-generator-form-values";
import { Field } from "./field";
import type { GeneratorFieldIds } from "./use-field-ids";
import styles from "./generator-form.module.css";

type GeneratorFormProps = {
  content: LinkedInPostGeneratorContent;
  errors: GeneratorFieldErrors;
  fieldIds: GeneratorFieldIds;
  hasCopied: boolean;
  isSubmitting: boolean;
  onCopyCaption: (caption: string) => void;
  onDownloadCaption: (caption: string, downloadFileName: string) => void;
  onDownloadImage: (imageDataUrl: string, downloadFileName: string) => void;
  onChange: <K extends keyof LinkedInPostGeneratorFormValues>(
    key: K,
    next: LinkedInPostGeneratorFormValues[K],
  ) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  state: GeneratorState;
  successfulRuns: number;
  values: LinkedInPostGeneratorFormValues;
};

export function GeneratorForm({
  content,
  errors,
  fieldIds,
  hasCopied,
  isSubmitting,
  onCopyCaption,
  onDownloadCaption,
  onDownloadImage,
  onChange,
  onSubmit,
  state,
  successfulRuns,
  values,
}: GeneratorFormProps) {
  const topicMax = content.form.topic.maxLength ?? 280;
  const expertiseMax = content.form.expertise.maxLength ?? 120;
  const displayNameMax = content.form.displayName.maxLength ?? 80;
  const isSuccess = state.kind === GeneratorStateKind.Success;
  const generatorNote =
    isSuccess && state.usageLimit
      ? state.usageLimit.remaining <= 0
        ? content.preview.success.followUp.body
        : content.preview.success.remainingNote
            .replace("{{remaining}}", String(state.usageLimit.remaining))
            .replace("{{limit}}", String(state.usageLimit.limit))
      : successfulRuns >= 2
        ? content.preview.success.followUp.body
        : content.preview.success.trialNote;
  const toneOptions = content.form.tone.options;
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

      <fieldset className={styles.deliveryGroup}>
        <legend className={styles.legend}>{content.form.delivery.title}</legend>
        <p className={styles.legendHelp}>{content.form.delivery.body}</p>

        <Field
          error={errors.displayName}
          help={content.form.displayName.help}
          htmlFor={fieldIds.displayName}
          label={content.form.displayName.label}
          meta={`${values.displayName.length}/${displayNameMax}`}
        >
          <input
            aria-describedby={
              errors.displayName ? `${fieldIds.displayName}-error` : undefined
            }
            aria-invalid={Boolean(errors.displayName)}
            autoComplete="name"
            className={styles.input}
            id={fieldIds.displayName}
            maxLength={displayNameMax}
            name="displayName"
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onChange("displayName", event.target.value)
            }
            placeholder={content.form.displayName.placeholder}
            type="text"
            value={values.displayName}
          />
        </Field>

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

        {values.email.trim() !== "" ? (
          <>
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
              <span className={styles.consentText}>
                {content.form.consent.label}
              </span>
            </label>
            {errors.consent ? (
              <p
                className={styles.consentError}
                id={`${fieldIds.consent}-error`}
              >
                {errors.consent}
              </p>
            ) : null}
          </>
        ) : null}
      </fieldset>

      <p className={styles.trialNote} aria-live="polite">
        {generatorNote}
      </p>

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

      {isSuccess ? (
        <div className={styles.successPanel}>
          <p aria-hidden="true" className={styles.successMark}>
            READY
          </p>
          <h3 className={styles.successHeadline}>
            {content.preview.success.headline}
          </h3>
          <div className={styles.successActions}>
            <button
              className={styles.copyButton}
              data-state={hasCopied ? "copied" : "default"}
              onClick={() => onCopyCaption(state.caption)}
              type="button"
            >
              {hasCopied
                ? content.preview.success.copyCaptionCopied
                : content.preview.success.copyCaption}
            </button>
            <div className={styles.downloadRow}>
              <button
                className={styles.downloadButton}
                disabled={!state.imageDataUrl}
                onClick={() =>
                  state.imageDataUrl
                    ? onDownloadImage(
                        state.imageDataUrl,
                        state.downloadFileName,
                      )
                    : undefined
                }
                type="button"
              >
                {content.preview.success.downloadImage}
              </button>
              <button
                className={styles.downloadButton}
                onClick={() =>
                  onDownloadCaption(state.caption, state.downloadFileName)
                }
                type="button"
              >
                {content.preview.success.downloadCaption}
              </button>
            </div>
          </div>
        </div>
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
