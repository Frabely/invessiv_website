"use client";

import type { ComponentProps } from "react";
import { useEffect, useId, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ContactConsentField } from "@/components/shared/form/contact-consent-field/contact-consent-field";
import sharedStyles from "@/components/marketing/home/sections/contact-section/shared/contact-form-primitives.module.css";
import { ContactIdentityFields } from "@/components/marketing/home/sections/contact-section/shared/contact-identity-fields/contact-identity-fields";
import { ContactMessageField } from "@/components/marketing/home/sections/contact-section/shared/contact-message-field/contact-message-field";
import { ContactPortraitCard } from "@/components/marketing/home/sections/contact-section/contact-portrait-card/contact-portrait-card";
import { ProjectScopeField } from "@/components/marketing/home/sections/contact-section/contact-form/project-scope-field/project-scope-field";
import {
  ButtonControl,
  PrimaryCtaButton,
} from "@/components/shared/button/button";
import { FormActions } from "@/components/shared/form/form-actions/form-actions";
import { FormStatus } from "@/components/shared/form/form-status/form-status";
import { useLanguage } from "@/components/providers/language-provider";
import {
  createCalendlyPrefillHref,
  submitDiscoveryCall,
  submitQuickContact,
} from "@/client/contact/services/contact-form-service";
import { DEFAULT_CONTACT_FORM_VALUES } from "@invessiv/common/defaults/contact/contact-form-values";
import { CONTACT_FIELD_ERROR_CODE } from "@invessiv/common/constants/contact/contact-field-error-codes";
import { CONTACT_FORM_FIELD_NAME } from "@invessiv/common/constants/contact/contact-form-field-names";
import { type ContactProjectScope } from "@invessiv/common/constants/contact/contact-project-scopes";
import { CONTACT_REQUEST_KIND } from "@invessiv/common/constants/contact/contact-request-kind";
import {
  ContactSubmissionOrigin,
  type ContactSubmissionOrigin as ContactSubmissionOriginValue,
} from "@invessiv/common/constants/contact/contact-submission-origin";
import type { ContactFormValues } from "@invessiv/common/contracts/contact/forms/contact-form-values";
import { mapDiscoveryCallFormToDto } from "@/client/contact/mappers/map-discovery-call-form-to-dto";
import { mapQuickContactFormToDto } from "@/client/contact/mappers/map-quick-contact-form-to-dto";
import { createScopedContactMessage } from "@invessiv/common/patterns/contact/scoped-contact-message";
import type { ContactSubmitResponse } from "@invessiv/common/contracts/contact/submit/contact-submit";
import { CONTACT_SUBMIT_ERROR_CODE } from "@invessiv/common/contracts/contact/submit/contact-submit-error-code";
import type { ContactFormCopy } from "@/i18n/dictionaries/marketing/home";
import { PROJECT_OFFER_CHANGE_EVENT } from "@/common/constants/marketing/project-offer-change-event";
import { toContactProjectScope } from "@/common/constants/marketing/service-key-project-scope";
import type { ProjectOfferSyncDetail } from "@/common/contracts/marketing/project-offer-sync-detail";
import { ContactFormSubmitErrorType } from "@/lib/analytics/contact-form-submit-error-type";
import { getContactSubmitAnalyticsErrorType } from "@/lib/analytics/contact-submit-error-type";
import { trackDiscoveryCallCalendarClick } from "@/lib/analytics/events/discovery-call-events";
import { getContactTarget } from "@/lib/analytics/get-contact-target";
import { useContactFormAnalytics } from "@/hooks/analytics/use-contact-form-analytics";
import { SITE_ROUTES } from "@/config/routes";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";
import styles from "./contact-form.module.css";

type ContactFormProps = {
  calendlyHref: string;
  analyticsLocation?: string;
  formCopy: ContactFormCopy;
  origin?: ContactSubmissionOriginValue;
  privacyHref: string;
  projectScope?: ContactProjectScope;
  projectScopeLabel?: string;
  portrait?: {
    imageAlt: string;
  };
  showProjectScope?: boolean;
  submitPath?: string;
};

const ContactFormAction = {
  Call: "call",
  Email: "email",
} as const;

type ContactFormAction =
  (typeof ContactFormAction)[keyof typeof ContactFormAction];

export function ContactForm({
  calendlyHref,
  analyticsLocation = "contact",
  formCopy,
  origin = ContactSubmissionOrigin.Website,
  privacyHref,
  projectScope,
  projectScopeLabel,
  portrait,
  showProjectScope = true,
  submitPath,
}: ContactFormProps) {
  const { locale } = useLanguage();
  const fieldIdPrefix = useId();
  const honeypotId = `${fieldIdPrefix}-honeypot`;
  // Derived so two forms on one page cannot share the same error id.
  const consentErrorId = `${fieldIdPrefix}-consent-error`;
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<ContactFormAction | null>(
    null,
  );
  const callAnalytics = useContactFormAnalytics({
    formId: CONTACT_REQUEST_KIND.DiscoveryCall,
    location: analyticsLocation,
    target: "calendly",
  });
  const emailAnalytics = useContactFormAnalytics({
    formId: CONTACT_REQUEST_KIND.QuickContact,
    location: analyticsLocation,
    target: "email",
  });
  const {
    control,
    handleSubmit,
    register,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ContactFormValues>({
    defaultValues: {
      ...DEFAULT_CONTACT_FORM_VALUES,
      ...(projectScope ? { projectScope } : {}),
    },
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  const selectedScope = useWatch({
    control,
    name: CONTACT_FORM_FIELD_NAME.ProjectScope,
  });

  useEffect(() => {
    if (!showProjectScope) {
      return;
    }
    const handleOfferChange = (event: Event) => {
      const { detail } = event as CustomEvent<ProjectOfferSyncDetail>;
      const nextScope = toContactProjectScope(detail?.offerKey);

      if (nextScope) {
        setValue(CONTACT_FORM_FIELD_NAME.ProjectScope, nextScope);
      }
    };

    window.addEventListener(PROJECT_OFFER_CHANGE_EVENT, handleOfferChange);
    return () =>
      window.removeEventListener(PROJECT_OFFER_CHANGE_EVENT, handleOfferChange);
  }, [setValue, showProjectScope]);

  const getErrorMessage = (fieldName: keyof ContactFormValues): string => {
    const code = errors[fieldName]?.message ?? errors[fieldName]?.type;

    if (code === CONTACT_FIELD_ERROR_CODE.InvalidEmail) {
      return formCopy.fieldErrorInvalidEmail;
    }

    if (code === CONTACT_FIELD_ERROR_CODE.ConsentRequired) {
      return formCopy.fieldErrorConsentRequired;
    }

    return formCopy.fieldErrorRequired;
  };

  const getSubmitErrorMessage = (
    response: Extract<ContactSubmitResponse, { ok: false }>,
    action: ContactFormAction = ContactFormAction.Call,
  ): string => {
    if (response.code === CONTACT_SUBMIT_ERROR_CODE.RateLimited) {
      return formCopy.submitErrorRateLimited;
    }

    if (
      action === ContactFormAction.Email &&
      response.code === CONTACT_SUBMIT_ERROR_CODE.DeliveryUnavailable
    ) {
      return formCopy.emailSubmitErrorDelivery;
    }

    return formCopy.submitErrorGeneric;
  };

  // The service model has no column of its own on the quick-contact channel,
  // so it is prefixed to the message instead.
  const getScopeLine = (values: ContactFormValues): string => {
    if (!values.projectScope) {
      return "";
    }

    const scopeValue =
      projectScopeLabel ?? formCopy.projectScopeOptions[values.projectScope];

    return [formCopy.projectScopeLabel, scopeValue].filter(Boolean).join(": ");
  };

  const handleEmailSubmit = handleSubmit(
    async (values) => {
      setStatusMessage(null);

      if (values.honeypot.trim()) {
        // Silent success: the bot gets no signal that it was filtered.
        setStatusMessage(formCopy.emailSubmitSuccess);
        reset(DEFAULT_CONTACT_FORM_VALUES);
        return;
      }

      setPendingAction(ContactFormAction.Email);
      emailAnalytics.trackSubmitAttempt();

      try {
        const response = await submitQuickContact(
          mapQuickContactFormToDto(
            values,
            locale,
            createScopedContactMessage(getScopeLine(values), values.message),
            origin,
          ),
          { submitPath },
        );

        if (!response.ok) {
          setStatusMessage(
            getSubmitErrorMessage(response, ContactFormAction.Email),
          );
          emailAnalytics.trackSubmitError(
            getContactSubmitAnalyticsErrorType(response),
          );
          return;
        }

        emailAnalytics.trackSubmitSuccess();
        reset(DEFAULT_CONTACT_FORM_VALUES);
        emailAnalytics.resetFormAnalytics();
        window.location.assign(
          createLocalePathname(SITE_ROUTES.SUCCESS, locale),
        );
      } catch {
        setStatusMessage(formCopy.submitErrorGeneric);
        emailAnalytics.trackSubmitError(ContactFormSubmitErrorType.Generic);
      } finally {
        setPendingAction(null);
      }
    },
    () => {
      setPendingAction(null);
      emailAnalytics.trackSubmitError(ContactFormSubmitErrorType.Validation);
    },
  );

  const handleCallSubmit: NonNullable<ComponentProps<"form">["onSubmit"]> = (
    event,
  ) => {
    event.preventDefault();
    setStatusMessage(null);

    // Opened before the await so the browser still attributes it to the click.
    const pendingWindow = window.open("", "_blank");

    const submit = handleSubmit(
      async (values) => {
        if (values.honeypot.trim()) {
          pendingWindow?.close();
          setStatusMessage(formCopy.callSubmitSuccess);
          reset(DEFAULT_CONTACT_FORM_VALUES);
          return;
        }

        setPendingAction(ContactFormAction.Call);
        callAnalytics.trackSubmitAttempt();

        const response = await submitDiscoveryCall(
          mapDiscoveryCallFormToDto(values, locale, origin),
          { submitPath },
        );

        if (!response.ok) {
          pendingWindow?.close();
          setPendingAction(null);
          setStatusMessage(getSubmitErrorMessage(response));
          callAnalytics.trackSubmitError(
            getContactSubmitAnalyticsErrorType(response),
          );
          return;
        }

        let calendlyPrefillHref: string;
        try {
          calendlyPrefillHref = createCalendlyPrefillHref(values, {
            calendlyUrl: calendlyHref,
            concernAnswerSlot: 1,
            projectScopeAnswerSlot: 2,
            projectScopeLabel: values.projectScope
              ? (projectScopeLabel ??
                formCopy.projectScopeOptions[values.projectScope])
              : undefined,
          });
        } catch {
          pendingWindow?.close();
          setPendingAction(null);
          setStatusMessage(formCopy.submitErrorGeneric);
          callAnalytics.trackSubmitError(ContactFormSubmitErrorType.Generic);
          return;
        }

        setPendingAction(null);
        setStatusMessage(formCopy.callSubmitSuccess);
        callAnalytics.trackSubmitSuccess();
        trackDiscoveryCallCalendarClick(analyticsLocation);

        if (pendingWindow) {
          pendingWindow.opener = null;
          pendingWindow.location.replace(calendlyPrefillHref);
        } else {
          window.location.assign(calendlyPrefillHref);
        }

        reset(DEFAULT_CONTACT_FORM_VALUES);
        callAnalytics.resetFormAnalytics();
      },
      async () => {
        pendingWindow?.close();
        setPendingAction(null);
        callAnalytics.trackSubmitError(ContactFormSubmitErrorType.Validation);
      },
    );

    void submit();
  };

  const isBusy = pendingAction !== null;

  return (
    <div className={portrait ? styles.layout : undefined}>
      <div className={styles.panel}>
        <form
          className={sharedStyles.form}
          noValidate
          onSubmit={handleCallSubmit}
        >
          <ContactIdentityFields
            copy={formCopy}
            errors={errors}
            getErrorMessage={getErrorMessage}
            register={register}
          />

          {showProjectScope ? (
            <ProjectScopeField
              label={formCopy.projectScopeLabel}
              optionLabels={formCopy.projectScopeOptions}
              register={register}
              selectedScope={selectedScope}
              setValue={setValue}
            />
          ) : null}

          <ContactMessageField
            className={styles.messageField}
            copy={formCopy}
            errors={errors}
            getErrorMessage={getErrorMessage}
            register={register}
            required={false}
            rows={3}
          />

          <div className={styles.submitArea}>
            <ContactConsentField
              className={sharedStyles.consent}
              consentLabel={formCopy.consentLabel}
              errorClassName={sharedStyles.consentError}
              errorId={consentErrorId}
              errorMessage={
                errors[CONTACT_FORM_FIELD_NAME.ConsentAccepted]
                  ? getErrorMessage(CONTACT_FORM_FIELD_NAME.ConsentAccepted)
                  : undefined
              }
              privacyHref={privacyHref}
              privacyLabel={formCopy.privacyLabel}
              privacySuffix={formCopy.privacySuffix}
              registerAction={register}
            />

            <FormActions
              buttons={
                <PrimaryCtaButton
                  data-analytics-event="contact_click"
                  data-analytics-location={analyticsLocation}
                  data-analytics-target={
                    getContactTarget(calendlyHref) ?? "call"
                  }
                  disabled={isBusy}
                  type="submit"
                >
                  {pendingAction === ContactFormAction.Call
                    ? formCopy.callSubmittingLabel
                    : formCopy.callSubmitLabel}
                </PrimaryCtaButton>
              }
              layout="stacked"
              requiredHint={formCopy.requiredHint}
            />
          </div>

          {/* Bots fill every field they find; humans never see this one. */}
          <div aria-hidden="true" className={styles.honeypot}>
            <label htmlFor={honeypotId}>{formCopy.honeypotLabel}</label>
            <input
              {...register(CONTACT_FORM_FIELD_NAME.Honeypot)}
              autoComplete="off"
              id={honeypotId}
              tabIndex={-1}
              type="text"
            />
          </div>

          <div className={styles.emailHandoff}>
            <p className={styles.emailQuestion}>{formCopy.emailQuestion}</p>
            <p className={styles.emailNote}>{formCopy.emailNote}</p>
            <ButtonControl
              data-analytics-event="contact_click"
              data-analytics-location={analyticsLocation}
              data-analytics-target="email"
              disabled={isBusy}
              onClick={() => void handleEmailSubmit()}
              type="button"
              variant="ghost"
            >
              {pendingAction === ContactFormAction.Email
                ? formCopy.emailSubmittingLabel
                : formCopy.emailSubmitLabel}
            </ButtonControl>
          </div>
        </form>

        <FormStatus message={statusMessage} />
      </div>
      {portrait ? (
        <div className={styles.portraitColumn}>
          <ContactPortraitCard imageAlt={portrait.imageAlt} locale={locale} />
        </div>
      ) : null}
    </div>
  );
}
