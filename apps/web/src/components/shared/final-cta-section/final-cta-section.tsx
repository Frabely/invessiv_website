"use client";

import { useRouter } from "next/navigation";
import { type SubmitEvent, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { PrimaryCtaButton } from "@/components/shared/button/button";
import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import { ContactConsentField } from "@/components/shared/form/contact-consent-field/contact-consent-field";
import { FormField } from "@/components/shared/form/form-field/form-field";
import { submitQuickContact } from "@/client/contact/services/contact-form-service";
import { mapFinalCtaFormToDto } from "@/client/contact/mappers/map-final-cta-form-to-dto";
import { CONTACT_FORM_FIELD_NAME } from "@invessiv/common/constants/contact/contact-form-field-names";
import { CONTACT_FIELD_ERROR_CODE } from "@invessiv/common/constants/contact/contact-field-error-codes";
import { ContactSubmissionOrigin } from "@invessiv/common/constants/contact/contact-submission-origin";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { CONTACT_SUBMIT_ERROR_CODE } from "@invessiv/common/contracts/contact/submit/contact-submit-error-code";
import { SubmitState } from "@invessiv/common/constants/form/submit-state";
import { CONTACT_EMAIL_PATTERN } from "@invessiv/common/patterns/contact/contact-email";
import { CONTACT_URL_PATTERN } from "@invessiv/common/patterns/contact/contact-url";
import type { ContactSubmitResponse } from "@invessiv/common/contracts/contact/submit/contact-submit";
import type { FinalCtaFormValues } from "@invessiv/common/contracts/contact/forms/final-cta-form-values";
import { DEFAULT_FINAL_CTA_FORM_VALUES } from "@invessiv/common/defaults/contact/final-cta-form-values";
import type { Locale } from "@/config/i18n";
import {
  createConversionTransactionId,
  markLandingConversionPending,
} from "@/lib/analytics/google-ads-conversion/conversion-guard";
import { readStoredConsentChoice } from "@/lib/consent/consent-storage";
import { useContactFormAnalytics } from "@/hooks/analytics/use-contact-form-analytics";
import { ContactFormSubmitErrorType } from "@/lib/analytics/contact-form-submit-error-type";
import { getContactSubmitAnalyticsErrorType } from "@/lib/analytics/contact-submit-error-type";
import { useStaggeredSectionReveal } from "@/hooks/marketing/use-staggered-section-reveal";
import type { FinalCtaContent } from "@/i18n/dictionaries/shared/final-cta";
import styles from "./final-cta-section.module.css";

type FinalCtaSectionProps = FinalCtaContent & {
  analyticsLocation: string;
  formId: string;
  id: string;
  locale: Locale;
  origin?: ContactSubmissionOrigin;
  successRedirectHref: string;
  trackAdsConversion?: boolean;
};

export function FinalCtaSection({
  analyticsLocation,
  body,
  eyebrow,
  form,
  formId,
  id,
  locale,
  origin = ContactSubmissionOrigin.Website,
  successRedirectHref,
  title,
  trackAdsConversion = false,
  trustLine,
}: FinalCtaSectionProps) {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement | null>(null);
  useStaggeredSectionReveal(sectionRef, locale);

  const consentErrorId = `${formId}-consent-error`;
  const websiteField = form.fields.website;

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
    formId,
    location: analyticsLocation,
  });

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<FinalCtaFormValues>({
    defaultValues: DEFAULT_FINAL_CTA_FORM_VALUES,
    mode: "onSubmit",
  });

  const getFieldErrorMessage = (
    fieldName: keyof FinalCtaFormValues,
  ): string => {
    const code = errors[fieldName]?.message ?? errors[fieldName]?.type;

    if (code === CONTACT_FIELD_ERROR_CODE.InvalidEmail) {
      return form.errorEmail;
    }
    if (code === CONTACT_FIELD_ERROR_CODE.InvalidUrl) {
      return form.errorWebsite ?? form.errorGeneric;
    }
    if (code === CONTACT_FIELD_ERROR_CODE.ConsentRequired) {
      return form.errorConsent;
    }
    return form.errorRequired;
  };

  const getSubmitErrorMessage = (
    response: Extract<ContactSubmitResponse, { ok: false }>,
  ): string => {
    if (response.code === CONTACT_SUBMIT_ERROR_CODE.RateLimited) {
      return form.errorRateLimited;
    }
    if (response.code === CONTACT_SUBMIT_ERROR_CODE.DeliveryUnavailable) {
      return form.errorDelivery;
    }
    return form.errorGeneric;
  };

  const redirectToSuccess = ({
    markConversion,
  }: {
    markConversion: boolean;
  }) => {
    const hasMarketingConsent = readStoredConsentChoice()?.marketing === true;
    if (markConversion && trackAdsConversion && hasMarketingConsent) {
      markLandingConversionPending(createConversionTransactionId());
    }
    reset(DEFAULT_FINAL_CTA_FORM_VALUES);
    router.push(successRedirectHref);
  };

  const onValidSubmit = handleSubmit(
    async (values) => {
      if (values.honeypot.trim()) {
        redirectToSuccess({ markConversion: false });
        return;
      }

      trackSubmitAttempt();
      const dto = mapFinalCtaFormToDto(values, {
        locale,
        origin,
        payloadContext: form.payloadContext,
      });

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
        resetFormAnalytics();
        redirectToSuccess({ markConversion: true });
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

  const onSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    const honeypotValue = String(formData.get("honeypot") ?? "").trim();

    if (honeypotValue) {
      event.preventDefault();
      redirectToSuccess({ markConversion: false });
      return;
    }

    void onValidSubmit(event);
  };

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
        <form
          className={styles.formCard}
          data-analytics-location={analyticsLocation}
          noValidate
          onFocusCapture={() => trackFormStart()}
          onSubmit={onSubmit}
        >
          <div className={styles.fieldGrid}>
            <FormField
              errorMessage={
                errors.name ? getFieldErrorMessage("name") : undefined
              }
              inputProps={{
                ...register("name", {
                  validate: (value) =>
                    value.trim().length >= 2 ||
                    CONTACT_FIELD_ERROR_CODE.Required,
                }),
                "aria-invalid": errors.name ? "true" : undefined,
                autoComplete: form.fields.name.autocomplete,
                placeholder: form.fields.name.placeholder,
              }}
              kind={FormFieldKind.Text}
              label={form.fields.name.label}
              required
            />

            <FormField
              errorMessage={
                errors.email ? getFieldErrorMessage("email") : undefined
              }
              inputProps={{
                ...register("email", {
                  validate: (value) => {
                    const trimmed = value.trim();
                    if (!trimmed) {
                      return CONTACT_FIELD_ERROR_CODE.Required;
                    }
                    return CONTACT_EMAIL_PATTERN.test(trimmed)
                      ? true
                      : CONTACT_FIELD_ERROR_CODE.InvalidEmail;
                  },
                }),
                "aria-invalid": errors.email ? "true" : undefined,
                autoComplete: form.fields.email.autocomplete,
                inputMode: "email",
                placeholder: form.fields.email.placeholder,
              }}
              kind={FormFieldKind.Email}
              label={form.fields.email.label}
              required
            />
          </div>

          {websiteField ? (
            <FormField
              errorMessage={
                errors.website
                  ? getFieldErrorMessage(CONTACT_FORM_FIELD_NAME.Website)
                  : undefined
              }
              hint={websiteField.hint}
              inputProps={{
                ...register(CONTACT_FORM_FIELD_NAME.Website, {
                  validate: (value) => {
                    const trimmed = value.trim();
                    if (!trimmed) {
                      return true;
                    }
                    return CONTACT_URL_PATTERN.test(trimmed)
                      ? true
                      : CONTACT_FIELD_ERROR_CODE.InvalidUrl;
                  },
                }),
                "aria-invalid": errors.website ? "true" : undefined,
                autoComplete: websiteField.autocomplete,
                inputMode: "url",
                placeholder: websiteField.placeholder,
              }}
              kind={FormFieldKind.Url}
              label={websiteField.label}
            />
          ) : null}

          <FormField
            errorMessage={
              errors.goal
                ? getFieldErrorMessage(CONTACT_FORM_FIELD_NAME.Goal)
                : undefined
            }
            kind={FormFieldKind.Textarea}
            label={form.fields.goal.label}
            required
            textareaProps={{
              ...register(CONTACT_FORM_FIELD_NAME.Goal, {
                validate: (value) =>
                  value.trim().length >= 1 || CONTACT_FIELD_ERROR_CODE.Required,
              }),
              "aria-invalid": errors.goal ? "true" : undefined,
              placeholder: form.fields.goal.placeholder,
              rows: 5,
            }}
          />

          <label aria-hidden="true" className={styles.honeypot}>
            {form.fields.honeypot.label}
            <input
              {...register("honeypot")}
              autoComplete="off"
              tabIndex={-1}
              type="text"
            />
          </label>

          <ContactConsentField
            checkboxClassName={styles.consentCheckbox}
            className={styles.consent}
            consentLabel={form.consentLabel}
            errorClassName={styles.consentError}
            errorId={consentErrorId}
            errorMessage={
              errors[CONTACT_FORM_FIELD_NAME.ConsentAccepted]
                ? form.errorConsent
                : undefined
            }
            privacyHref={form.privacyHref}
            privacyLabel={form.privacyLabel}
            register={register}
          />

          <div className={styles.actions}>
            <PrimaryCtaButton
              className={styles.submit}
              data-analytics-event="cta_click"
              data-analytics-location={analyticsLocation}
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
      </div>

      <p className={styles.trustLine} data-reveal-item="true">
        {trustLine}
      </p>
    </section>
  );
}
