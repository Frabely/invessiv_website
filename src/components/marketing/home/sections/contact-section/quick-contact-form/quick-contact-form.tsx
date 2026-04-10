"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ContactConsentText } from "@/components/marketing/home/sections/contact-section/components/contact-consent-text";
import { ContactFormActions } from "@/components/marketing/home/sections/contact-section/components/contact-form-actions";
import { ContactHelperList } from "@/components/marketing/home/sections/contact-section/components/contact-helper-list";
import { ContactIdentityFields } from "@/components/marketing/home/sections/contact-section/components/contact-identity-fields";
import { ContactMessageField } from "@/components/marketing/home/sections/contact-section/components/contact-message-field";
import sharedStyles from "@/components/marketing/home/sections/contact-section/components/contact-form-primitives.module.css";
import { ContactFormShell } from "@/components/marketing/home/sections/contact-section/components/contact-form-shell";
import { ContactFormStatus } from "@/components/marketing/home/sections/contact-section/components/contact-form-status";
import { PrimaryCtaButton } from "@/components/shared/button/button";
import { useLanguage } from "@/components/providers/language-provider";
import { openQuickContactMailDraft } from "@/features/contact/client/contact-form-service";
import { mapQuickContactFormToDto } from "@/features/contact/client/map-quick-contact-form-to-dto";
import {
  DEFAULT_QUICK_CONTACT_FORM_VALUES,
  type QuickContactFormValues,
} from "@/features/contact/client/quick-contact-form.schema";
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
};

export function QuickContactForm({
  channel,
  formCopy,
  privacyHref,
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

    setStatusMessage(formCopy.submitSuccess);
    reset(DEFAULT_QUICK_CONTACT_FORM_VALUES);
    openQuickContactMailDraft(dto, {
      channelValue: channel.value,
      emailLabel: formCopy.emailLabel,
      firstNameLabel: formCopy.firstNameLabel,
      intro: formCopy.mailIntro,
      lastNameLabel: formCopy.lastNameLabel,
      subject: formCopy.mailSubject,
    });
  });

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
            onClick={copyChannelValue}
            type="button"
          >
            {isCopied
              ? (channel.copiedLabel ?? "Kopiert")
              : (channel.copyLabel ?? "E-Mail kopieren")}
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
