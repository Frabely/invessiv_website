"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ContactConsentField } from "@/components/shared/form/contact-consent-field/contact-consent-field";
import sharedStyles from "@/components/marketing/home/sections/contact-section/shared/contact-form-primitives.module.css";
import { ContactFormShell } from "@/components/marketing/home/sections/contact-section/shared/contact-form-shell/contact-form-shell";
import { ContactHelperList } from "@/components/marketing/home/sections/contact-section/shared/contact-helper-list/contact-helper-list";
import { ContactIdentityFields } from "@/components/marketing/home/sections/contact-section/shared/contact-identity-fields/contact-identity-fields";
import { ContactMessageField } from "@/components/marketing/home/sections/contact-section/shared/contact-message-field/contact-message-field";
import { PrimaryCtaButton } from "@/components/shared/button/button";
import { FormActions } from "@/components/shared/form/form-actions/form-actions";
import { FormStatus } from "@/components/shared/form/form-status/form-status";
import { useLanguage } from "@/components/providers/language-provider";
import { mapQuickContactFormToDto } from "@/client/contact/mappers/map-quick-contact-form-to-dto";
import { submitQuickContact } from "@/client/contact/services/contact-form-service";
import { DEFAULT_QUICK_CONTACT_FORM_VALUES } from "@invessiv/common/defaults/contact/quick-contact-form-values";
import { CONTACT_FIELD_ERROR_CODE } from "@invessiv/common/constants/contact/contact-field-error-codes";
import { CONTACT_FORM_FIELD_NAME } from "@invessiv/common/constants/contact/contact-form-field-names";
import { CONTACT_REQUEST_KIND } from "@invessiv/common/constants/contact/contact-request-kind";
import type { QuickContactFormValues } from "@invessiv/common/contracts/contact/forms/quick-contact-form-values";
import type { ContactSubmitResponse } from "@invessiv/common/contracts/contact/submit/contact-submit";
import { CONTACT_SUBMIT_ERROR_CODE } from "@invessiv/common/contracts/contact/submit/contact-submit-error-code";
import type {
  ContactChannelCopy,
  QuickContactFormCopy,
} from "@/i18n/dictionaries/marketing/home";
import { useContactFormAnalytics } from "@/hooks/analytics/use-contact-form-analytics";
import { ContactFormSubmitErrorType } from "@/lib/analytics/contact-form-submit-error-type";
import { getContactSubmitAnalyticsErrorType } from "@/lib/analytics/contact-submit-error-type";
import styles from "./quick-contact-form.module.css";

type ContactChannel = ContactChannelCopy;

type QuickContactFormProps = {
  channel: ContactChannel;
  formCopy: QuickContactFormCopy;
  privacyHref: string;
  submitPath?: string;
};

export function QuickContactForm({
  channel,
  formCopy,
  privacyHref,
  submitPath,
}: QuickContactFormProps) {
  const { locale } = useLanguage();
  const [isCopied, setIsCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const {
    resetFormAnalytics,
    trackFormStart,
    trackSubmitAttempt,
    trackSubmitError,
    trackSubmitSuccess,
  } = useContactFormAnalytics({
    formId: CONTACT_REQUEST_KIND.QuickContact,
    location: "contact",
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuickContactFormValues>({
    defaultValues: DEFAULT_QUICK_CONTACT_FORM_VALUES,
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  useEffect(() => {
    if (!isCopied) {
      return;
    }

    const timeoutId = window.setTimeout(() => setIsCopied(false), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [isCopied]);

  const getErrorMessage = (fieldName: keyof QuickContactFormValues) => {
    const code = errors[fieldName]?.message ?? errors[fieldName]?.type;

    if (code === CONTACT_FIELD_ERROR_CODE.ConsentRequired) {
      return formCopy.fieldErrorConsentRequired;
    }

    if (code === CONTACT_FIELD_ERROR_CODE.InvalidEmail) {
      return formCopy.fieldErrorInvalidEmail;
    }

    return formCopy.fieldErrorRequired;
  };

  const copyChannelValue = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      setIsCopied(false);
      return;
    }

    const valueToCopy = channel.copyValue ?? channel.value;

    try {
      await navigator.clipboard.writeText(valueToCopy);
      setIsCopied(true);
    } catch {
      setIsCopied(false);
    }
  };

  const onSubmit = handleSubmit(
    async (values) => {
      const dto = mapQuickContactFormToDto(values, locale);
      setStatusMessage(formCopy.submittingLabel);
      trackSubmitAttempt();

      try {
        const response = await submitQuickContact(dto, { submitPath });
        if (!response.ok) {
          setStatusMessage(getSubmitErrorMessage(response));
          trackSubmitError(getContactSubmitAnalyticsErrorType(response));
          return;
        }

        trackSubmitSuccess();
        setStatusMessage(formCopy.submitSuccess);
        reset(DEFAULT_QUICK_CONTACT_FORM_VALUES);
        resetFormAnalytics();
      } catch {
        setStatusMessage(formCopy.submitErrorGeneric);
        trackSubmitError(ContactFormSubmitErrorType.Generic);
      }
    },
    () => {
      trackSubmitError(ContactFormSubmitErrorType.Validation);
    },
  );

  const getSubmitErrorMessage = (
    response: Extract<ContactSubmitResponse, { ok: false }>,
  ): string => {
    if (response.code === CONTACT_SUBMIT_ERROR_CODE.RateLimited) {
      return formCopy.submitErrorRateLimited;
    }

    if (response.code === CONTACT_SUBMIT_ERROR_CODE.DeliveryUnavailable) {
      return formCopy.submitErrorDelivery;
    }

    return formCopy.submitErrorGeneric;
  };

  return (
    <ContactFormShell
      footer={<FormStatus message={statusMessage} />}
      intro={formCopy.intro}
      meta={
        <div className={styles.metaCard}>
          <div className={styles.metaCopy}>
            <p className={styles.metaLabel}>
              {channel.metaLabel ?? formCopy.metaLabel}
            </p>
            <p className={styles.metaValue}>{channel.value}</p>
          </div>
          <button
            className={styles.copyButton}
            onClick={copyChannelValue}
            type="button"
          >
            {isCopied
              ? (channel.copiedLabel ?? formCopy.copiedActionLabel)
              : (channel.copyLabel ?? formCopy.copyActionLabel)}
          </button>
        </div>
      }
      subtitle={formCopy.subtitle}
      title={formCopy.title}
    >
      <form
        className={sharedStyles.form}
        noValidate
        onFocusCapture={() => trackFormStart()}
        onSubmit={onSubmit}
      >
        {channel.detailPoints?.length ? (
          <ContactHelperList items={channel.detailPoints} />
        ) : null}

        <ContactIdentityFields
          copy={formCopy}
          errors={errors}
          getErrorMessage={getErrorMessage}
          register={register}
        />

        <ContactMessageField
          className={sharedStyles.messageField}
          copy={formCopy}
          errors={errors}
          getErrorMessage={getErrorMessage}
          register={register}
        />

        <ContactConsentField
          className={sharedStyles.consent}
          consentLabel={formCopy.consentLabel}
          errorClassName={sharedStyles.consentError}
          errorId="quick-contact-consent-error"
          errorMessage={
            errors[CONTACT_FORM_FIELD_NAME.ConsentAccepted]
              ? getErrorMessage(CONTACT_FORM_FIELD_NAME.ConsentAccepted)
              : undefined
          }
          privacyHref={privacyHref}
          privacyLabel={formCopy.privacyLabel}
          register={register}
        />

        <FormActions
          buttons={
            <PrimaryCtaButton disabled={isSubmitting} type="submit">
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
