"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ContactConsentText } from "@/components/marketing/home/sections/contact-section/components/contact-consent-text";
import { ContactFormActions } from "@/components/marketing/home/sections/contact-section/components/contact-form-actions";
import { ContactFormField } from "@/components/marketing/home/sections/contact-section/components/contact-form-field";
import { ContactHelperList } from "@/components/marketing/home/sections/contact-section/components/contact-helper-list";
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
  const canCopy = typeof navigator !== "undefined" && !!navigator.clipboard;
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
    if (!canCopy) {
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
      fullNameLabel: formCopy.fullNameLabel,
      intro: formCopy.mailIntro,
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
            disabled={!canCopy}
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
      <form className={styles.form} noValidate onSubmit={onSubmit}>
        {channel.helper ? (
          <p className={styles.helper}>{channel.helper}</p>
        ) : null}

        {channel.detailPoints?.length ? (
          <ContactHelperList items={channel.detailPoints} />
        ) : null}

        <div className={`${styles.grid} ${styles.gridTwo}`}>
          <ContactFormField
            controlClassName={styles.fieldControl}
            errorMessage={
              errors.fullName ? getErrorMessage("fullName") : undefined
            }
            inputProps={{
              ...register("fullName", { required: "required" }),
              "aria-invalid": errors.fullName ? "true" : undefined,
              autoCapitalize: "words",
              autoComplete: "name",
            }}
            kind="text"
            label={formCopy.fullNameLabel}
            required
          />

          <ContactFormField
            controlClassName={styles.fieldControl}
            errorMessage={errors.email ? getErrorMessage("email") : undefined}
            inputProps={{
              ...register("email", {
                required: "required",
                pattern: {
                  message: "invalid_email",
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                },
              }),
              "aria-invalid": errors.email ? "true" : undefined,
              autoComplete: "email",
            }}
            kind="email"
            label={formCopy.emailLabel}
            required
          />
        </div>

        <ContactFormField
          className={styles.messageField}
          errorMessage={errors.message ? getErrorMessage("message") : undefined}
          kind="textarea"
          label={formCopy.messageLabel}
          required
          textareaProps={{
            ...register("message", {
              required: "message_required",
              validate: (value) =>
                value.trim().length > 0 || "message_required",
            }),
            "aria-invalid": errors.message ? "true" : undefined,
            placeholder: formCopy.messagePlaceholder,
            rows: 5,
          }}
        />

        <label className={styles.consent}>
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
            errorClassName={styles.consentError}
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
          panelHint={channel.hint}
          requiredHint={formCopy.requiredHint}
        />
      </form>
    </ContactFormShell>
  );
}
