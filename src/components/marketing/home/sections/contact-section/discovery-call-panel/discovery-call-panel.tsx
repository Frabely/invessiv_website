"use client";

import { useState } from "react";
import type { ComponentProps } from "react";
import { useForm } from "react-hook-form";
import { ContactConsentText } from "@/components/marketing/home/sections/contact-section/shared/contact-consent-text/contact-consent-text";
import { ContactFormActions } from "@/components/marketing/home/sections/contact-section/shared/contact-form-actions/contact-form-actions";
import sharedStyles from "@/components/marketing/home/sections/contact-section/shared/contact-form-primitives.module.css";
import { ContactFormShell } from "@/components/marketing/home/sections/contact-section/shared/contact-form-shell/contact-form-shell";
import { ContactFormStatus } from "@/components/marketing/home/sections/contact-section/shared/contact-form-status/contact-form-status";
import { ContactHelperList } from "@/components/marketing/home/sections/contact-section/shared/contact-helper-list/contact-helper-list";
import { ContactIdentityFields } from "@/components/marketing/home/sections/contact-section/shared/contact-identity-fields/contact-identity-fields";
import { ContactMessageField } from "@/components/marketing/home/sections/contact-section/shared/contact-message-field/contact-message-field";
import { PrimaryCtaButton } from "@/components/shared/button/button";
import { useLanguage } from "@/components/providers/language-provider";
import {
  createCalendlyPrefillHref,
  submitDiscoveryCall,
} from "@/client/contact/services/contact-form-service";
import { DEFAULT_DISCOVERY_CALL_FORM_VALUES } from "@/common/defaults/contact/discovery-call-form-values";
import type { DiscoveryCallFormValues } from "@/common/contracts/contact/forms/discovery-call-form-values";
import { mapDiscoveryCallFormToDto } from "@/client/contact/mappers/map-discovery-call-form-to-dto";
import type { ContactSubmitResponse } from "@/common/contracts/contact/submit/contact-submit";
import type {
  ContactChannelCopy,
  DiscoveryCallFormCopy,
} from "@/i18n/dictionaries/marketing/home";
import { getContactSubmitAnalyticsErrorType } from "@/lib/analytics/contact-submit-error-type";
import { trackDiscoveryCallCalendarClick } from "@/lib/analytics/events/discovery-call-events";
import { getContactTarget } from "@/lib/analytics/get-contact-target";
import { useContactFormAnalytics } from "@/hooks/analytics/use-contact-form-analytics";

type ContactChannel = ContactChannelCopy;

type DiscoveryCallPanelProps = {
  channel: ContactChannel;
  formCopy: DiscoveryCallFormCopy;
  privacyHref: string;
  submitPath?: string;
};

export function DiscoveryCallPanel({
  channel,
  formCopy,
  privacyHref,
  submitPath,
}: DiscoveryCallPanelProps) {
  const { locale } = useLanguage();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const {
    resetFormAnalytics,
    trackFormStart,
    trackSubmitAttempt,
    trackSubmitError,
    trackSubmitSuccess,
  } = useContactFormAnalytics({
    formId: "discovery_call",
    location: "contact",
    target: "calendly",
  });
  const {
    handleSubmit,
    register,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DiscoveryCallFormValues>({
    defaultValues: DEFAULT_DISCOVERY_CALL_FORM_VALUES,
  });

  const getErrorMessage = (
    fieldName: keyof DiscoveryCallFormValues,
  ): string => {
    const code = errors[fieldName]?.message ?? errors[fieldName]?.type;

    if (code === "invalid_email") {
      return formCopy.fieldErrorInvalidEmail;
    }

    if (code === "consent_required") {
      return formCopy.fieldErrorConsentRequired;
    }

    return formCopy.fieldErrorRequired;
  };

  const handleCalendlySubmit: NonNullable<
    ComponentProps<"form">["onSubmit"]
  > = (event) => {
    event.preventDefault();

    const pendingWindow = window.open("", "_blank");

    const submit = handleSubmit(
      async (values) => {
        trackSubmitAttempt();
        const response = await submitDiscoveryCall(
          mapDiscoveryCallFormToDto(values, locale),
          { submitPath },
        );

        if (!response.ok) {
          pendingWindow?.close();
          setStatusMessage(getSubmitErrorMessage(response));
          trackSubmitError(getContactSubmitAnalyticsErrorType(response));
          return;
        }

        const calendlyHref = createCalendlyPrefillHref(values, {
          calendlyUrl: channel.href,
          concernAnswerSlot: 1,
        });

        setStatusMessage(formCopy.submitSuccess);
        trackSubmitSuccess();
        trackDiscoveryCallCalendarClick();

        if (pendingWindow) {
          pendingWindow.opener = null;
          pendingWindow.location.replace(calendlyHref);
        } else {
          window.location.assign(calendlyHref);
        }

        reset(DEFAULT_DISCOVERY_CALL_FORM_VALUES);
        resetFormAnalytics();
      },
      async () => {
        pendingWindow?.close();
        trackSubmitError("validation");
      },
    );

    void submit(event);
  };

  const getSubmitErrorMessage = (
    response: Extract<ContactSubmitResponse, { ok: false }>,
  ): string => {
    if (response.code === "rate_limited") {
      return formCopy.submitErrorRateLimited;
    }

    return formCopy.submitErrorGeneric;
  };

  return (
    <ContactFormShell
      footer={<ContactFormStatus message={statusMessage} />}
      intro={formCopy.intro}
      subtitle={formCopy.subtitle}
      title={formCopy.title}
    >
      <form
        className={sharedStyles.form}
        noValidate
        onFocusCapture={() => trackFormStart()}
        onSubmit={handleCalendlySubmit}
      >
        {channel.detailPoints?.length ? (
          <ContactHelperList items={channel.detailPoints} />
        ) : null}

        <div className={`${sharedStyles.grid} ${sharedStyles.gridTwo}`}>
          <ContactIdentityFields
            controlClassName={sharedStyles.fieldControl}
            copy={formCopy}
            errors={errors}
            getErrorMessage={getErrorMessage}
            register={register}
          />
        </div>

        <ContactMessageField
          className={sharedStyles.messageField}
          copy={formCopy}
          errors={errors}
          getErrorMessage={getErrorMessage}
          register={register}
          required={false}
        />

        <label className={sharedStyles.consent}>
          <input
            {...register("consentAccepted", {
              validate: (value) => value || "consent_required",
            })}
            aria-describedby="discovery-call-consent-error"
            aria-invalid={errors.consentAccepted ? "true" : undefined}
            type="checkbox"
          />
          <ContactConsentText
            consentLabel={formCopy.consentLabel}
            errorClassName={sharedStyles.consentError}
            errorId="discovery-call-consent-error"
            errorMessage={
              errors.consentAccepted
                ? getErrorMessage("consentAccepted")
                : undefined
            }
            privacyHref={privacyHref}
            privacyLabel={formCopy.privacyLabel}
          />
        </label>

        <ContactFormActions
          buttons={
            <PrimaryCtaButton
              data-analytics-event="contact_click"
              data-analytics-location="contact"
              data-analytics-target={getContactTarget(channel.href) ?? "call"}
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? formCopy.submittingLabel : formCopy.submitLabel}
            </PrimaryCtaButton>
          }
          layout="stacked"
          requiredHint={formCopy.requiredHint}
        />
      </form>
    </ContactFormShell>
  );
}
