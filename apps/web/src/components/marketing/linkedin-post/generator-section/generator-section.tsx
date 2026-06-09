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
import { LinkedInPostGeneratorErrorCode } from "@/common/constants/generator/linkedin-post-generator-error-codes";
import type { GeneratorFieldErrors } from "@/common/contracts/generator/generator-field-errors";
import type {
  GeneratorState,
  GeneratorUsageLimit,
} from "@/common/contracts/generator/generator-state";
import type { LinkedInPostGeneratorFormValues } from "@/common/contracts/generator/linkedin-post-generator-form-values";
import { LINKEDIN_POST_GENERATOR_INITIAL_VALUES } from "@/common/contracts/generator/linkedin-post-generator-form-values";
import type { ProjectOfferSyncDetail } from "@/common/contracts/marketing/project-offer-sync-detail";
import { PROJECT_OFFER_CHANGE_EVENT } from "@/common/constants/marketing/project-offer-change-event";
import { CONTACT_OFFER_KEY } from "@invessiv/common/constants/contact/contact-offer-keys";
import type { Locale } from "@/config/i18n";
import { LINKEDIN_POST_SECTION_HREFS } from "@/config/navigation/linkedin-post";
import type { LinkedInPostGeneratorContent } from "@/i18n/dictionaries/linkedin-post/generator";
import type { LeadIdentity } from "@/common/contracts/generator/lead-identity";
import { GeneratorForm } from "./generator-form";
import { PreviewPanel } from "./preview-panel";
import { useGeneratorFieldIds } from "@/hooks/marketing/use-generator-field-ids";
import styles from "./generator-section.module.css";

const EMPTY_LEAD_IDENTITY: LeadIdentity = { displayName: "", email: "" };

const GeneratorSectionLayout = {
  Initial: "initial",
  Split: "split",
  Limit: "limit",
  Result: "result",
} as const;

type GeneratorSectionLayout =
  (typeof GeneratorSectionLayout)[keyof typeof GeneratorSectionLayout];

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
  const fieldIds = useGeneratorFieldIds();
  const [values, setValues] = useState<LinkedInPostGeneratorFormValues>(
    () => LINKEDIN_POST_GENERATOR_INITIAL_VALUES,
  );
  const [errors, setErrors] = useState<GeneratorFieldErrors>({});
  const [state, setState] = useState<GeneratorState | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [usageLimit, setUsageLimit] = useState<GeneratorUsageLimit | undefined>(
    undefined,
  );
  const [leadIdentity, setLeadIdentity] =
    useState<LeadIdentity>(EMPTY_LEAD_IDENTITY);
  const formSlotRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const workbenchRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (state?.kind !== GeneratorStateKind.Loading) {
      return;
    }
    const totalSteps = content.preview.loading.steps.length;
    const interval = window.setInterval(() => {
      setState((current) => {
        if (current?.kind !== GeneratorStateKind.Loading) {
          return current;
        }
        const nextIndex = Math.min(current.stepIndex + 1, totalSteps - 1);
        return { kind: GeneratorStateKind.Loading, stepIndex: nextIndex };
      });
    }, 320);
    return () => window.clearInterval(interval);
  }, [content.preview.loading.steps.length, state?.kind]);

  useEffect(() => {
    if (
      state?.kind !== GeneratorStateKind.Success &&
      state?.kind !== GeneratorStateKind.LimitReached &&
      state?.kind !== GeneratorStateKind.Error
    ) {
      return;
    }

    previewRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [state?.kind]);

  useEffect(() => {
    const formSlot = formSlotRef.current;
    const workbench = workbenchRef.current;
    if (!formSlot || !workbench || typeof ResizeObserver === "undefined") {
      return;
    }

    const updatePanelHeight = () => {
      workbench.style.setProperty(
        "--generator-panel-height",
        `${formSlot.getBoundingClientRect().height}px`,
      );
    };

    updatePanelHeight();
    const observer = new ResizeObserver(updatePanelHeight);
    observer.observe(formSlot);
    return () => observer.disconnect();
  }, []);

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

  function handleRequestNewPost() {
    setState(null);
    setHasCopied(false);
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  /**
   * Best-effort prefill of the contact form: dispatch the offer-change event
   * with the LinkedIn-content offer and any identity captured in the lead step,
   * then let the anchor scroll to #contact. A cold limit (no prior lead step)
   * simply leaves the identity empty — no error.
   */
  function handleRequestCustomWorkflow() {
    if (typeof window === "undefined") {
      return;
    }
    const detail: ProjectOfferSyncDetail = {
      offerKey: CONTACT_OFFER_KEY.Process,
      displayName: leadIdentity.displayName || undefined,
      email: leadIdentity.email || undefined,
    };
    window.dispatchEvent(
      new CustomEvent(PROJECT_OFFER_CHANGE_EVENT, { detail }),
    );
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

    return next;
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    emitAnalytics(GeneratorAnalyticsEvent.SubmitAttempt);

    if (values.company.trim() !== "") {
      // Honeypot — silently no-op (return to the initial, preview-less state)
      setState(null);
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

    if (result.usageLimit) {
      setUsageLimit(result.usageLimit);
    }

    if (!result.ok) {
      if (
        result.code === LinkedInPostGeneratorErrorCode.UsageLimitReached &&
        result.usageLimit
      ) {
        setState({
          kind: GeneratorStateKind.LimitReached,
          usageLimit: result.usageLimit,
        });
      } else {
        setState({
          kind: GeneratorStateKind.Error,
          code: result.code,
          usageLimit: result.usageLimit,
        });
      }
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
      usageLimit: result.usageLimit,
      deliveryToken: result.deliveryToken,
    });
    emitAnalytics(GeneratorAnalyticsEvent.Success);
  }

  const layout: GeneratorSectionLayout = !state
    ? GeneratorSectionLayout.Initial
    : state.kind === GeneratorStateKind.LimitReached
      ? GeneratorSectionLayout.Limit
      : state.kind === GeneratorStateKind.Success
        ? GeneratorSectionLayout.Result
        : GeneratorSectionLayout.Split;
  const showForm =
    layout === GeneratorSectionLayout.Initial ||
    layout === GeneratorSectionLayout.Split;

  return (
    <section className={styles.section} id={id}>
      <header className={styles.intro}>
        <EyebrowPill className={styles.eyebrow}>{content.eyebrow}</EyebrowPill>
        <h2 className={styles.title}>{content.title}</h2>
        <p className={styles.body}>{content.body}</p>
      </header>

      <div className={styles.workbench} data-layout={layout} ref={workbenchRef}>
        {showForm ? (
          <div className={styles.formSlot} ref={formSlotRef}>
            <GeneratorForm
              content={content}
              errors={errors}
              fieldIds={fieldIds}
              isSubmitting={state?.kind === GeneratorStateKind.Loading}
              locale={locale}
              onChange={handleFieldChange}
              onSubmit={handleSubmit}
              usageLimit={usageLimit}
              values={values}
            />
          </div>
        ) : null}

        {state ? (
          <div className={styles.previewSlot} ref={previewRef}>
            <PreviewPanel
              content={content}
              followUpHref={LINKEDIN_POST_SECTION_HREFS.contact}
              hasCopied={hasCopied}
              locale={locale}
              onCopyCaption={handleCopyCaption}
              onLeadIdentityChange={setLeadIdentity}
              onRequestNewPost={handleRequestNewPost}
              onRequestCustomWorkflow={handleRequestCustomWorkflow}
              state={state}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
