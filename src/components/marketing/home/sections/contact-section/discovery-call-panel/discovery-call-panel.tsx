"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useForm } from "react-hook-form";
import { ContactConsentText } from "@/components/marketing/home/sections/contact-section/components/contact-consent-text";
import { ContactFormActions } from "@/components/marketing/home/sections/contact-section/components/contact-form-actions";
import { ContactHelperList } from "@/components/marketing/home/sections/contact-section/components/contact-helper-list";
import { ContactIdentityFields } from "@/components/marketing/home/sections/contact-section/components/contact-identity-fields";
import { ContactMessageField } from "@/components/marketing/home/sections/contact-section/components/contact-message-field";
import { ContactFormShell } from "@/components/marketing/home/sections/contact-section/components/contact-form-shell";
import { ContactFormStatus } from "@/components/marketing/home/sections/contact-section/components/contact-form-status";
import { PrimaryCtaButton } from "@/components/shared/button/button";
import {
  createCalendlyPrefillHref,
} from "@/features/contact/client/contact-form-service";
import {
  DEFAULT_DISCOVERY_CALL_FORM_VALUES,
  type DiscoveryCallFormValues,
} from "@/features/contact/client/discovery-call-form.schema";
import type { LandingSectionCopy } from "@/i18n/dictionaries/marketing/home";
import { getContactTarget } from "@/lib/analytics/get-contact-target";
import styles from "./discovery-call-panel.module.css";

type ContactChannel = NonNullable<
  LandingSectionCopy["contactChannels"]
>[number];
type DiscoveryCallFormCopy = NonNullable<
  LandingSectionCopy["discoveryCallForm"]
>;

type DiscoveryCallPanelProps = {
  channel: ContactChannel;
  formCopy: DiscoveryCallFormCopy;
  privacyHref: string;
};

export function DiscoveryCallPanel({
  channel,
  formCopy,
  privacyHref,
}: DiscoveryCallPanelProps) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
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

  const handleCalendlySubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const pendingWindow = window.open("", "_blank");

    const submit = handleSubmit(
      async (values) => {
        const calendlyHref = createCalendlyPrefillHref(values, {
          calendlyUrl: channel.href,
          concernAnswerSlot: 1,
        });

        setStatusMessage(formCopy.submitSuccess);

        if (pendingWindow) {
          pendingWindow.opener = null;
          pendingWindow.location.replace(calendlyHref);
        } else {
          window.location.assign(calendlyHref);
        }

        reset(DEFAULT_DISCOVERY_CALL_FORM_VALUES);
      },
      async () => {
        pendingWindow?.close();
      },
    );

    void submit(event);
  };

  return (
    <ContactFormShell
      footer={<ContactFormStatus message={statusMessage} />}
      intro={formCopy.intro}
      subtitle={formCopy.subtitle}
      title={formCopy.title}
    >
      <form className={styles.form} noValidate onSubmit={handleCalendlySubmit}>
        {channel.detailPoints?.length ? (
          <ContactHelperList items={channel.detailPoints} />
        ) : null}

        <div className={`${styles.grid} ${styles.gridTwo}`}>
          <ContactIdentityFields
            controlClassName={styles.fieldControl}
            copy={formCopy}
            errors={errors}
            getErrorMessage={getErrorMessage}
            register={register}
          />
        </div>

        <ContactMessageField
          className={styles.messageField}
          copy={formCopy}
          errors={errors}
          getErrorMessage={getErrorMessage}
          register={register}
          required={false}
        />

        <label className={styles.consent}>
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
            errorClassName={styles.consentError}
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
