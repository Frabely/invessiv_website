"use client";

import { type SubmitEvent, useEffect, useRef, useState } from "react";
import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import {
  type LinkedInPostGeneratorResult,
  linkedinPostGeneratorService,
} from "@/client/linkedin-post/services/linkedin-post-generator-service";
import {
  GENERATOR_FORM_ID,
  GeneratorAnalyticsEvent,
  GeneratorErrorReason,
} from "@/common/constants/generator/generator-analytics";
import { GeneratorStateKind } from "@/common/constants/generator/generator-state-kind";
import type { GeneratorFieldErrors } from "@/common/contracts/generator/generator-field-errors";
import type { GeneratorState } from "@/common/contracts/generator/generator-state";
import type { LinkedInPostGeneratorFormValues } from "@/common/contracts/generator/linkedin-post-generator-form-values";
import { LINKEDIN_POST_GENERATOR_INITIAL_VALUES } from "@/common/contracts/generator/linkedin-post-generator-form-values";
import type { Locale } from "@/config/i18n";
import type { LinkedInPostGeneratorContent } from "@/i18n/dictionaries/linkedin-post/generator";
import { GeneratorForm } from "./generator-form";
import { PreviewPanel } from "./preview-panel";
import { useFieldIds } from "./use-field-ids";
import styles from "./generator-section.module.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type GeneratorSectionProps = {
  id: string;
  locale: Locale;
  content: LinkedInPostGeneratorContent;
  submitGenerator?: typeof linkedinPostGeneratorService.submitLinkedInPost;
};

export function GeneratorSection({
  id,
  locale,
  content,
  submitGenerator = linkedinPostGeneratorService.submitLinkedInPost,
}: GeneratorSectionProps) {
  const fieldIds = useFieldIds();
  const [values, setValues] = useState<LinkedInPostGeneratorFormValues>(
    () => LINKEDIN_POST_GENERATOR_INITIAL_VALUES,
  );
  const [errors, setErrors] = useState<GeneratorFieldErrors>({});
  const [state, setState] = useState<GeneratorState>({ kind: "idle" });
  const [hasStarted, setHasStarted] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (state.kind !== GeneratorStateKind.Loading) {
      return;
    }
    const totalSteps = content.preview.loading.steps.length;
    const interval = window.setInterval(() => {
      setState((current) => {
        if (current.kind !== GeneratorStateKind.Loading) {
          return current;
        }
        const nextIndex = Math.min(current.stepIndex + 1, totalSteps - 1);
        return { kind: GeneratorStateKind.Loading, stepIndex: nextIndex };
      });
    }, 320);
    return () => window.clearInterval(interval);
  }, [content.preview.loading.steps.length, state.kind]);

  useEffect(() => {
    if (
      state.kind === GeneratorStateKind.Success ||
      state.kind === GeneratorStateKind.Error
    ) {
      previewRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [state.kind]);

  function emitAnalytics(
    event: GeneratorAnalyticsEvent,
    extra?: Record<string, string>,
  ) {
    if (typeof window === "undefined") {
      return;
    }
    const detail = { form_id: GENERATOR_FORM_ID, locale, ...extra };
    window.dispatchEvent(new CustomEvent(event, { detail }));
  }

  function handleStart() {
    if (hasStarted) {
      return;
    }
    setHasStarted(true);
    emitAnalytics(GeneratorAnalyticsEvent.FormStart);
  }

  function handleCopyCaption(caption: string) {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }
    navigator.clipboard.writeText(caption).then(() => {
      setHasCopied(true);
      window.setTimeout(() => setHasCopied(false), 2200);
    });
  }

  function handleImageDownload(imageDataUrl: string, downloadFileName: string) {
    const link = document.createElement("a");
    link.download = downloadFileName;
    link.href = imageDataUrl;
    link.click();
  }

  function handleCaptionDownload(caption: string, downloadFileName: string) {
    const link = document.createElement("a");
    link.download = downloadFileName.replace(/\.png$/u, ".txt");
    link.href = `data:text/plain;charset=utf-8,${encodeURIComponent(caption)}`;
    link.click();
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
      delete updated[key as keyof GeneratorFieldErrors];
      return updated;
    });
  }

  function validate(): GeneratorFieldErrors {
    const next: GeneratorFieldErrors = {};
    const topic = values.topic.trim();
    const expertise = values.expertise.trim();
    const displayName = values.displayName.trim();
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

    if (!displayName) {
      next.displayName = content.form.displayName.requiredError;
    } else if (
      content.form.displayName.maxLength &&
      displayName.length > content.form.displayName.maxLength &&
      content.form.displayName.tooLongError
    ) {
      next.displayName = content.form.displayName.tooLongError;
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

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    emitAnalytics(GeneratorAnalyticsEvent.SubmitAttempt);

    if (values.company.trim() !== "") {
      // Honeypot — silently no-op
      setState({ kind: GeneratorStateKind.Idle });
      return;
    }

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setHasCopied(false);
    setState({ kind: GeneratorStateKind.Loading, stepIndex: 0 });

    let result: LinkedInPostGeneratorResult;
    try {
      result = await submitGenerator(values, locale);
    } catch {
      setState({ kind: GeneratorStateKind.Error });
      emitAnalytics(GeneratorAnalyticsEvent.Error, {
        reason: GeneratorErrorReason.Network,
      });
      return;
    }

    if (!result.ok) {
      setState({ kind: GeneratorStateKind.Error });
      emitAnalytics(GeneratorAnalyticsEvent.Error, { reason: result.code });
      return;
    }

    setState({
      kind: GeneratorStateKind.Success,
      post: result.post,
      caption: result.caption,
      downloadFileName: result.downloadFileName,
      imageDataUrl: result.imageDataUrl,
      previewHtml: result.previewHtml,
    });
    emitAnalytics(GeneratorAnalyticsEvent.Success);
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
          hasCopied={hasCopied}
          isSubmitting={state.kind === GeneratorStateKind.Loading}
          onCopyCaption={handleCopyCaption}
          onDownloadCaption={handleCaptionDownload}
          onDownloadImage={handleImageDownload}
          onChange={handleFieldChange}
          onSubmit={handleSubmit}
          state={state}
          values={values}
        />

        <div className={styles.previewSlot} ref={previewRef}>
          <PreviewPanel
            content={content}
            hasCopied={hasCopied}
            onCopyCaption={handleCopyCaption}
            onDownloadCaption={handleCaptionDownload}
            onDownloadImage={handleImageDownload}
            state={state}
          />
        </div>
      </div>
    </section>
  );
}
