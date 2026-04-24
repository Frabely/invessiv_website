"use client";

import { useEffect, useState } from "react";
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
import { mapQuickContactFormToDto } from "@/client/contact/mappers/map-quick-contact-form-to-dto";
import { submitQuickContact } from "@/client/contact/services/contact-form-service";
import { DEFAULT_QUICK_CONTACT_FORM_VALUES } from "@/common/defaults/contact/quick-contact-form-values";
import type { QuickContactFormValues } from "@/common/contracts/contact/forms/quick-contact-form-values";
import type { ContactSubmitResponse } from "@/common/contracts/contact/submit/contact-submit";
import type { LandingSectionCopy } from "@/i18n/dictionaries/marketing/home";
import styles from "./quick-contact-form.module.css";

type ContactChannel = NonNullable<
  LandingSectionCopy["contactChannels"]
>[number];
type QuickContactFormCopy = NonNullable<LandingSectionCopy["quickContactForm"]>;

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
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuickContactFormValues>({
    defaultValues: DEFAULT_QUICK_CONTACT_FORM_VALUES,
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

    if (code === "consent_required") {
      return formCopy.fieldErrorConsentRequired;
    }

    if (code === "invalid_email") {
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

  const onSubmit = handleSubmit(async (values) => {
    const dto = mapQuickContactFormToDto(values, locale);
    setStatusMessage(formCopy.submittingLabel);

    try {
      const response = await submitQuickContact(dto, { submitPath });
      if (!response.ok) {
        setStatusMessage(getSubmitErrorMessage(response));
        return;
      }

      setStatusMessage(formCopy.submitSuccess);
      reset(DEFAULT_QUICK_CONTACT_FORM_VALUES);
    } catch {
      setStatusMessage(formCopy.submitErrorGeneric);
    }
  });

  const getSubmitErrorMessage = (
    response: Extract<ContactSubmitResponse, { ok: false }>,
  ): string => {
    if (response.code === "rate_limited") {
      return formCopy.submitErrorRateLimited;
    }

    if (response.code === "delivery_unavailable") {
      return formCopy.submitErrorDelivery;
    }

    return formCopy.submitErrorGeneric;
  };

  return (
    <ContactFormShell
      footer={<ContactFormStatus message={statusMessage} />}
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
            data-cursor-kind="copy"
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
      <form className={sharedStyles.form} noValidate onSubmit={onSubmit}>
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
        />

        <label className={sharedStyles.consent}>
          <input
            {...register("consentAccepted", {
              validate: (value) => value || "consent_required",
            })}
            aria-describedby="quick-contact-consent-error"
            aria-invalid={errors.consentAccepted ? "true" : undefined}
            type="checkbox"
          />
          <ContactConsentText
            consentLabel={formCopy.consentLabel}
            errorClassName={sharedStyles.consentError}
            errorId="quick-contact-consent-error"
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
