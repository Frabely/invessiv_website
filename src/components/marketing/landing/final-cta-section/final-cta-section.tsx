"use client";

import { useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { PrimaryCtaButton } from "@/components/shared/button/button";
import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import { submitQuickContact } from "@/client/contact/services/contact-form-service";
import { CONTACT_FORM_FIELD_NAME } from "@invessiv/common/constants/contact/contact-form-field-names";
import { SubmitState } from "@invessiv/common/constants/form/submit-state";
import type { ContactSubmitResponse } from "@invessiv/common/contracts/contact/submit/contact-submit";
import type { SaveQuickContactDto } from "@invessiv/common/contracts/contact/quick-contact/save-quick-contact-dto";
import type { Locale } from "@/config/i18n";
import { useContactFormAnalytics } from "@/hooks/analytics/use-contact-form-analytics";
import { ContactFormSubmitErrorType } from "@/lib/analytics/contact-form-submit-error-type";
import { getContactSubmitAnalyticsErrorType } from "@/lib/analytics/contact-submit-error-type";
import { useStaggeredSectionReveal } from "@/hooks/marketing/use-staggered-section-reveal";
import type { LandingFinalCtaContent } from "@/i18n/dictionaries/landing/final-cta";
import styles from "./final-cta-section.module.css";

type FinalCtaSectionProps = LandingFinalCtaContent & {
  id: string;
  locale: Locale;
};

type FormValues = {
  consentAccepted: boolean;
  email: string;
  honeypot: string;
  name: string;
  [CONTACT_FORM_FIELD_NAME.Goal]: string;
  [CONTACT_FORM_FIELD_NAME.Website]: string;
};

const DEFAULT_FORM_VALUES: FormValues = {
  consentAccepted: false,
  email: "",
  honeypot: "",
  name: "",
  [CONTACT_FORM_FIELD_NAME.Goal]: "",
  [CONTACT_FORM_FIELD_NAME.Website]: "",
};

const URL_PATTERN = /^https?:\/\/\S+\.\S+/i;

function buildMessage(
  goal: string,
  website: string,
  payloadContext: string,
): string {
  const trimmedWebsite = website.trim();
  const trimmedGoal = goal.trim();
  const trimmedContext = payloadContext.trim();
  const messageParts = trimmedContext ? [trimmedContext] : [];

  if (!trimmedWebsite) {
    messageParts.push(trimmedGoal);
    return messageParts.join("\n\n");
  }

  messageParts.push(`Website: ${trimmedWebsite}`, trimmedGoal);
  return messageParts.join("\n\n");
}

export function FinalCtaSection({
  body,
  eyebrow,
  form,
  id,
  locale,
  title,
  trustLine,
}: FinalCtaSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  useStaggeredSectionReveal(sectionRef, locale);

  const fieldIdPrefix = useId();
  const nameId = `${fieldIdPrefix}-name`;
  const emailId = `${fieldIdPrefix}-email`;
  const websiteId = `${fieldIdPrefix}-website`;
  const goalId = `${fieldIdPrefix}-goal`;
  const consentErrorId = `${fieldIdPrefix}-consent-error`;
  const websiteHintId = `${fieldIdPrefix}-website-hint`;

  const [submitState, setSubmitState] = useState<{
    kind: (typeof SubmitState.Kind)[keyof typeof SubmitState.Kind];
    message?: string;
  }>({ kind: SubmitState.Kind.Idle });
  const {
    resetFormAnalytics,
    trackFormStart,
    trackSubmitAttempt,
    trackSubmitError,
    trackSubmitSuccess,
  } = useContactFormAnalytics({
    formId: "landing_final_cta",
    location: "landing_final_cta",
  });

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<FormValues>({
    defaultValues: DEFAULT_FORM_VALUES,
    mode: "onSubmit",
  });

  const getSubmitErrorMessage = (
    response: Extract<ContactSubmitResponse, { ok: false }>,
  ): string => {
    if (response.code === "rate_limited") {
      return form.errorRateLimited;
    }
    if (response.code === "delivery_unavailable") {
      return form.errorDelivery;
    }
    return form.errorGeneric;
  };

  const onSubmit = handleSubmit(
    async (values) => {
      if (values.honeypot.trim()) {
        setSubmitState({
          kind: SubmitState.Kind.Success,
          message: form.successBody,
        });
        reset(DEFAULT_FORM_VALUES);
        return;
      }

      trackSubmitAttempt();
      const dto: SaveQuickContactDto = {
        consentAccepted: values.consentAccepted,
        displayName: values.name.trim(),
        email: values.email.trim(),
        kind: "quick_contact",
        locale,
        message: buildMessage(
          values[CONTACT_FORM_FIELD_NAME.Goal],
          values[CONTACT_FORM_FIELD_NAME.Website],
          form.payloadContext,
        ),
      };

      try {
        const response = await submitQuickContact(dto);
        if (!response.ok) {
          setSubmitState({
            kind: SubmitState.Kind.Error,
            message: getSubmitErrorMessage(response),
          });
          trackSubmitError(getContactSubmitAnalyticsErrorType(response));
          return;
        }
        trackSubmitSuccess();
        setSubmitState({ kind: SubmitState.Kind.Success });
        reset(DEFAULT_FORM_VALUES);
        resetFormAnalytics();
      } catch {
        setSubmitState({
          kind: SubmitState.Kind.Error,
          message: form.errorGeneric,
        });
        trackSubmitError(ContactFormSubmitErrorType.Generic);
      }
    },
    () => {
      trackSubmitError(ContactFormSubmitErrorType.Validation);
    },
  );

  const isSuccess = submitState.kind === SubmitState.Kind.Success;

  return (
    <section
      aria-labelledby={`${id}-title`}
      className={styles.section}
      id={id}
      ref={sectionRef}
    >
      <span aria-hidden="true" className={styles.spotlight} />

      <div className={styles.intro} data-reveal-item="true">
        <EyebrowPill className={styles.eyebrow}>{eyebrow}</EyebrowPill>
        <h2 className={styles.title} id={`${id}-title`}>
          {title}
        </h2>
        <p className={styles.body}>{body}</p>
      </div>

      <div className={styles.stage} data-reveal-item="true">
        {isSuccess ? (
          <div aria-live="polite" className={styles.successPanel} role="status">
            <span aria-hidden="true" className={styles.successCheck}>
              <svg
                fill="none"
                height="22"
                viewBox="0 0 24 24"
                width="22"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 12.5l4.2 4 9.3-9.5"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.4"
                />
              </svg>
            </span>
            <h3 className={styles.successTitle}>{form.successTitle}</h3>
            <p className={styles.successBody}>{form.successBody}</p>
          </div>
        ) : (
          <form
            className={styles.formCard}
            data-analytics-location="landing_final_cta"
            noValidate
            onFocusCapture={() => trackFormStart()}
            onSubmit={onSubmit}
          >
            <div className={styles.fieldGrid}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={nameId}>
                  {form.fields.name.label}
                  <span aria-hidden="true" className={styles.required}>
                    *
                  </span>
                </label>
                <input
                  {...register("name", {
                    validate: (value) => value.trim().length >= 2 || "required",
                  })}
                  aria-describedby={errors.name ? `${nameId}-error` : undefined}
                  aria-invalid={errors.name ? "true" : undefined}
                  aria-required="true"
                  autoComplete={form.fields.name.autocomplete}
                  className={styles.input}
                  id={nameId}
                  placeholder={form.fields.name.placeholder}
                  type="text"
                />
                <p
                  className={styles.errorText}
                  id={`${nameId}-error`}
                  role={errors.name ? "alert" : undefined}
                >
                  {errors.name ? form.errorRequired : " "}
                </p>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor={emailId}>
                  {form.fields.email.label}
                  <span aria-hidden="true" className={styles.required}>
                    *
                  </span>
                </label>
                <input
                  {...register("email", {
                    validate: (value) => {
                      const trimmed = value.trim();
                      if (!trimmed) {
                        return "required";
                      }
                      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
                        ? true
                        : "invalid_email";
                    },
                  })}
                  aria-describedby={
                    errors.email ? `${emailId}-error` : undefined
                  }
                  aria-invalid={errors.email ? "true" : undefined}
                  aria-required="true"
                  autoComplete={form.fields.email.autocomplete}
                  className={styles.input}
                  id={emailId}
                  inputMode="email"
                  placeholder={form.fields.email.placeholder}
                  type="email"
                />
                <p
                  className={styles.errorText}
                  id={`${emailId}-error`}
                  role={errors.email ? "alert" : undefined}
                >
                  {errors.email
                    ? errors.email.message === "invalid_email"
                      ? form.errorEmail
                      : form.errorRequired
                    : " "}
                </p>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor={websiteId}>
                {form.fields.website.label}
              </label>
              <input
                {...register(CONTACT_FORM_FIELD_NAME.Website, {
                  validate: (value) => {
                    const trimmed = value.trim();
                    if (!trimmed) {
                      return true;
                    }
                    return URL_PATTERN.test(trimmed) ? true : "invalid_url";
                  },
                })}
                aria-describedby={
                  errors.website ? `${websiteId}-error` : websiteHintId
                }
                aria-invalid={errors.website ? "true" : undefined}
                autoComplete={form.fields.website.autocomplete}
                className={styles.input}
                id={websiteId}
                inputMode="url"
                placeholder={form.fields.website.placeholder}
                type="url"
              />
              {form.fields.website.hint ? (
                <p className={styles.hint} id={websiteHintId}>
                  {form.fields.website.hint}
                </p>
              ) : null}
              <p
                className={styles.errorText}
                id={`${websiteId}-error`}
                role={errors.website ? "alert" : undefined}
              >
                {errors.website ? form.errorWebsite : " "}
              </p>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor={goalId}>
                {form.fields.goal.label}
                <span aria-hidden="true" className={styles.required}>
                  *
                </span>
              </label>
              <textarea
                {...register(CONTACT_FORM_FIELD_NAME.Goal, {
                  validate: (value) => value.trim().length >= 1 || "required",
                })}
                aria-describedby={errors.goal ? `${goalId}-error` : undefined}
                aria-invalid={errors.goal ? "true" : undefined}
                aria-required="true"
                className={styles.textarea}
                id={goalId}
                placeholder={form.fields.goal.placeholder}
                rows={5}
              />
              <p
                className={styles.errorText}
                id={`${goalId}-error`}
                role={errors.goal ? "alert" : undefined}
              >
                {errors.goal ? form.errorRequired : " "}
              </p>
            </div>

            <label aria-hidden="true" className={styles.honeypot}>
              {form.fields.honeypot.label}
              <input
                {...register("honeypot")}
                autoComplete="off"
                tabIndex={-1}
                type="text"
              />
            </label>

            <label className={styles.consent}>
              <input
                {...register("consentAccepted", {
                  validate: (value) => value || "consent_required",
                })}
                aria-describedby={consentErrorId}
                aria-invalid={errors.consentAccepted ? "true" : undefined}
                className={styles.consentCheckbox}
                type="checkbox"
              />
              <span className={styles.consentText}>
                {form.consentLabel}{" "}
                <a
                  className={styles.consentLink}
                  href={form.privacyHref}
                  rel="noopener"
                  target="_blank"
                >
                  {form.privacyLabel}
                </a>
                .
              </span>
            </label>
            <p
              className={styles.errorText}
              id={consentErrorId}
              role={errors.consentAccepted ? "alert" : undefined}
            >
              {errors.consentAccepted ? form.errorConsent : " "}
            </p>

            <div className={styles.actions}>
              <PrimaryCtaButton
                className={styles.submit}
                data-analytics-event="cta_click"
                data-analytics-location="landing_final_cta"
                data-analytics-target="form_submit"
                data-analytics-variant="primary"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? form.submittingLabel : form.submitLabel}
              </PrimaryCtaButton>
              <p className={styles.requiredHint}>{form.requiredHint}</p>
            </div>

            {submitState.kind === SubmitState.Kind.Error &&
            submitState.message ? (
              <p aria-live="polite" className={styles.submitError} role="alert">
                {submitState.message}
              </p>
            ) : null}
          </form>
        )}
      </div>

      <p className={styles.trustLine} data-reveal-item="true">
        {trustLine}
      </p>
    </section>
  );
}
