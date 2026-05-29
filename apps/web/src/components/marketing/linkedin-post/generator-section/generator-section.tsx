"use client";

import Image from "next/image";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { PrimaryCtaButton } from "@/components/shared/button/button";
import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import {
  type LinkedInPostGeneratorResult,
  submitLinkedInPostGenerator as defaultSubmit,
} from "@/client/generator/submit-linkedin-post-generator";
import type { Locale } from "@/config/i18n";
import type { LinkedInPostGeneratorContent } from "@/i18n/dictionaries/linkedin-post/generator";
import { CustomPostBlock } from "./custom-post-block/custom-post-block";
import {
  LINKEDIN_POST_GENERATOR_INITIAL_VALUES,
  type LinkedInPostGeneratorFormValues,
} from "@invessiv/common/contracts/generator/linkedin-post-generator-form-values";
import styles from "./generator-section.module.css";

const ANALYTICS_FORM_ID = "linkedin_post_generator";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type GeneratorState =
  | { kind: "idle" }
  | { kind: "loading"; stepIndex: number }
  | {
      kind: "success";
      imageUrl: string;
      caption: string;
      downloadToken: string;
    }
  | { kind: "error" };

type GeneratorSectionProps = {
  id: string;
  locale: Locale;
  content: LinkedInPostGeneratorContent;
  submitGenerator?: typeof defaultSubmit;
};

type FieldErrors = Partial<
  Record<"topic" | "expertise" | "tone" | "email" | "consent", string>
>;

export function GeneratorSection({
  id,
  locale,
  content,
  submitGenerator = defaultSubmit,
}: GeneratorSectionProps) {
  const fieldIds = useFieldIds();
  const [values, setValues] = useState<LinkedInPostGeneratorFormValues>(
    () => LINKEDIN_POST_GENERATOR_INITIAL_VALUES,
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [state, setState] = useState<GeneratorState>({ kind: "idle" });
  const [hasStarted, setHasStarted] = useState(false);
  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (state.kind !== "loading") {
      return;
    }
    const totalSteps = content.preview.loading.steps.length;
    const interval = window.setInterval(() => {
      setState((current) => {
        if (current.kind !== "loading") {
          return current;
        }
        const nextIndex = Math.min(current.stepIndex + 1, totalSteps - 1);
        return { kind: "loading", stepIndex: nextIndex };
      });
    }, 320);
    return () => window.clearInterval(interval);
  }, [content.preview.loading.steps.length, state.kind]);

  useEffect(() => {
    if (state.kind === "success" || state.kind === "error") {
      previewRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [state.kind]);

  function emitAnalytics(event: string, extra?: Record<string, string>) {
    if (typeof window === "undefined") {
      return;
    }
    const detail = { form_id: ANALYTICS_FORM_ID, locale, ...extra };
    window.dispatchEvent(new CustomEvent(event, { detail }));
  }

  function handleStart() {
    if (hasStarted) {
      return;
    }
    setHasStarted(true);
    emitAnalytics("generator_form_start");
  }

  function handleFieldChange<K extends keyof LinkedInPostGeneratorFormValues>(
    key: K,
    next: LinkedInPostGeneratorFormValues[K],
  ) {
    handleStart();
    setValues((current) => ({ ...current, [key]: next }));
    setErrors((current) => {
      if (!(key in current)) {
        return current;
      }
      const updated = { ...current };
      delete updated[key as keyof FieldErrors];
      return updated;
    });
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    const topic = values.topic.trim();
    const expertise = values.expertise.trim();
    const email = values.email.trim();

    if (!topic) {
      next.topic = content.form.topic.requiredError;
    } else if (
      content.form.topic.maxLength &&
      topic.length > content.form.topic.maxLength &&
      content.form.topic.tooLongError
    ) {
      next.topic = content.form.topic.tooLongError;
    }

    if (!expertise) {
      next.expertise = content.form.expertise.requiredError;
    } else if (
      content.form.expertise.maxLength &&
      expertise.length > content.form.expertise.maxLength &&
      content.form.expertise.tooLongError
    ) {
      next.expertise = content.form.expertise.tooLongError;
    }

    if (!email) {
      next.email = content.form.email.requiredError;
    } else if (!EMAIL_PATTERN.test(email) && content.form.email.invalidError) {
      next.email = content.form.email.invalidError;
    }

    if (!values.consent) {
      next.consent = content.form.consent.requiredError;
    }

    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    emitAnalytics("generator_submit_attempt");

    if (values.company.trim() !== "") {
      // Honeypot — silently no-op
      setState({ kind: "idle" });
      return;
    }

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setState({ kind: "loading", stepIndex: 0 });

    let result: LinkedInPostGeneratorResult;
    try {
      result = await submitGenerator(values);
    } catch {
      setState({ kind: "error" });
      emitAnalytics("generator_error", { reason: "network" });
      return;
    }

    if (!result.ok) {
      setState({ kind: "error" });
      emitAnalytics("generator_error", { reason: result.code });
      return;
    }

    setState({
      kind: "success",
      imageUrl: result.imageUrl,
      caption: result.caption,
      downloadToken: result.downloadToken,
    });
    emitAnalytics("generator_success");
  }

  return (
    <section className={styles.section} id={id}>
      <header className={styles.intro}>
        <EyebrowPill className={styles.eyebrow}>{content.eyebrow}</EyebrowPill>
        <h2 className={styles.title}>{content.title}</h2>
        <p className={styles.body}>{content.body}</p>
      </header>

      <div className={styles.workbench}>
        <GeneratorForm
          content={content}
          errors={errors}
          fieldIds={fieldIds}
          isSubmitting={state.kind === "loading"}
          onChange={handleFieldChange}
          onSubmit={handleSubmit}
          values={values}
        />

        <div className={styles.previewSlot} ref={previewRef}>
          <PreviewPanel content={content} state={state} />
        </div>
      </div>
    </section>
  );
}

type GeneratorFormProps = {
  content: LinkedInPostGeneratorContent;
  errors: FieldErrors;
  fieldIds: ReturnType<typeof useFieldIds>;
  isSubmitting: boolean;
  onChange: <K extends keyof LinkedInPostGeneratorFormValues>(
    key: K,
    next: LinkedInPostGeneratorFormValues[K],
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  values: LinkedInPostGeneratorFormValues;
};

function GeneratorForm({
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

type FieldProps = {
  children: React.ReactNode;
  error?: string;
  help?: string;
  htmlFor: string;
  label: string;
  meta?: string;
};

function Field({ children, error, help, htmlFor, label, meta }: FieldProps) {
  return (
    <div className={styles.field} data-has-error={Boolean(error) || undefined}>
      <div className={styles.fieldHead}>
        <label className={styles.label} htmlFor={htmlFor}>
          {label}
        </label>
        {meta ? <span className={styles.fieldMeta}>{meta}</span> : null}
      </div>
      {children}
      {error ? (
        <p className={styles.fieldError} id={`${htmlFor}-error`} role="alert">
          {error}
        </p>
      ) : help ? (
        <p className={styles.fieldHelp}>{help}</p>
      ) : null}
    </div>
  );
}

type PreviewPanelProps = {
  content: LinkedInPostGeneratorContent;
  state: GeneratorState;
};

function PreviewPanel({ content, state }: PreviewPanelProps) {
  if (state.kind === "idle") {
    return <IdlePreview content={content} />;
  }
  if (state.kind === "loading") {
    return <LoadingPreview content={content} stepIndex={state.stepIndex} />;
  }
  if (state.kind === "error") {
    return <ErrorPreview content={content} />;
  }
  return (
    <SuccessPreview
      caption={state.caption}
      content={content}
      downloadToken={state.downloadToken}
      imageUrl={state.imageUrl}
    />
  );
}

function IdlePreview({ content }: { content: LinkedInPostGeneratorContent }) {
  const { idle } = content.preview;
  return (
    <div className={styles.preview} data-state="idle">
      <div className={styles.previewFrame}>
        <span aria-hidden="true" className={styles.previewSilhouette} />
        <div className={styles.previewBody}>
          <p className={styles.previewMark} aria-hidden="true">
            ⌗ {idle.stepLabel} 01
          </p>
          <h3 className={styles.previewHeadline}>{idle.headline}</h3>
          <p className={styles.previewCopy}>{idle.body}</p>
        </div>
      </div>
    </div>
  );
}

function LoadingPreview({
  content,
  stepIndex,
}: {
  content: LinkedInPostGeneratorContent;
  stepIndex: number;
}) {
  const { loading } = content.preview;
  return (
    <div className={styles.preview} data-state="loading">
      <div className={styles.previewFrame}>
        <span aria-hidden="true" className={styles.skeletonShimmer} />
        <div className={styles.previewBody}>
          <p className={styles.previewMark} aria-hidden="true">
            ⌗ 0{stepIndex + 1}/0{loading.steps.length}
          </p>
          <h3 className={styles.previewHeadline}>{loading.headline}</h3>
          <p className={styles.previewCopy}>{loading.body}</p>
          <ol aria-live="polite" className={styles.stepsList}>
            {loading.steps.map((step, index) => (
              <li
                className={styles.stepItem}
                data-status={
                  index < stepIndex
                    ? "done"
                    : index === stepIndex
                      ? "active"
                      : "pending"
                }
                key={step}
              >
                <span aria-hidden="true" className={styles.stepDot} />
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function ErrorPreview({ content }: { content: LinkedInPostGeneratorContent }) {
  const { error } = content.preview;
  return (
    <div className={styles.preview} data-state="error" role="alert">
      <div className={styles.previewFrame}>
        <div className={styles.previewBody}>
          <p className={styles.previewMark} aria-hidden="true">
            ⌗ ERROR
          </p>
          <h3 className={styles.previewHeadline}>{error.headline}</h3>
          <p className={styles.previewCopy}>{error.body}</p>
        </div>
      </div>
    </div>
  );
}

type SuccessPreviewProps = {
  caption: string;
  content: LinkedInPostGeneratorContent;
  downloadToken: string;
  imageUrl: string;
};

function SuccessPreview({
  caption,
  content,
  downloadToken,
  imageUrl,
}: SuccessPreviewProps) {
  const { success } = content.preview;
  const [hasCopied, setHasCopied] = useState(false);
  const copyResetTimeout = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyResetTimeout.current) {
        window.clearTimeout(copyResetTimeout.current);
      }
    };
  }, []);

  function handleCopy() {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }
    navigator.clipboard.writeText(caption).then(() => {
      setHasCopied(true);
      if (copyResetTimeout.current) {
        window.clearTimeout(copyResetTimeout.current);
      }
      copyResetTimeout.current = window.setTimeout(
        () => setHasCopied(false),
        2200,
      );
    });
  }

  function handleAnalyticsDownload(target: "image" | "text") {
    if (typeof window === "undefined") {
      return;
    }
    window.dispatchEvent(
      new CustomEvent("post_download", {
        detail: {
          form_id: ANALYTICS_FORM_ID,
          target,
        },
      }),
    );
  }

  const captionTextHref = `data:text/plain;charset=utf-8,${encodeURIComponent(caption)}`;

  return (
    <div className={styles.preview} data-state="success">
      <div className={styles.previewFrame}>
        <div className={styles.successMedia}>
          <Image
            alt={success.imageAlt}
            className={styles.successImage}
            fill
            sizes="(max-width: 720px) 100vw, 480px"
            src={imageUrl}
            unoptimized
          />
        </div>
        <div className={styles.previewBody}>
          <p className={styles.previewMark} aria-hidden="true">
            ⌗ READY
          </p>
          <h3 className={styles.previewHeadline}>{success.headline}</h3>
          <div className={styles.captionBlock}>
            <p className={styles.captionLabel}>{success.captionLabel}</p>
            <p className={styles.captionText}>{caption}</p>
            <button
              className={styles.copyButton}
              data-state={hasCopied ? "copied" : "default"}
              onClick={handleCopy}
              type="button"
            >
              {hasCopied ? success.copyCaptionCopied : success.copyCaption}
            </button>
          </div>
          <div className={styles.downloadRow}>
            <a
              className={styles.downloadButton}
              data-analytics-event="post_download"
              data-analytics-target="image"
              download
              href={imageUrl}
              onClick={() => handleAnalyticsDownload("image")}
            >
              {success.downloadImage}
            </a>
            <a
              className={styles.downloadButton}
              data-analytics-event="post_download"
              data-analytics-target="text"
              download={`linkedin-post-${downloadToken}.txt`}
              href={captionTextHref}
              onClick={() => handleAnalyticsDownload("text")}
            >
              {success.downloadCaption}
            </a>
          </div>
        </div>
      </div>

      <CustomPostBlock content={content.customPost} />
    </div>
  );
}

function useFieldIds() {
  const baseId = useId();
  return {
    topic: `${baseId}-topic`,
    expertise: `${baseId}-expertise`,
    email: `${baseId}-email`,
    consent: `${baseId}-consent`,
    honeypot: `${baseId}-company`,
  };
}
