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
import {
  AnalyticsFormFailureReason,
  AnalyticsFormId,
  AnalyticsFormPlacement,
} from "@/common/constants/analytics/analytics-form";
import { getContactSubmitFailureReason } from "@/lib/analytics/contact-submit-error-type";
import {
  useContactFormAnalytics,
  useContactFormStartTracking,
} from "@/hooks/analytics/use-contact-form-analytics";
import { SITE_ROUTES } from "@/config/routes";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";
import { useRequestGuard } from "@/hooks/analytics/use-request-guard";
import styles from "./contact-form.module.css";

type ContactFormProps = {
  calendlyHref: string;
  analyticsPlacement?: AnalyticsFormPlacement;
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
  analyticsPlacement = AnalyticsFormPlacement.HomeContact,
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
  const beginRequest = useRequestGuard();
  const fieldIdPrefix = useId();
  const honeypotId = `${fieldIdPrefix}-honeypot`;
  // Derived so two forms on one page cannot share the same error id.
  const consentErrorId = `${fieldIdPrefix}-consent-error`;
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<ContactFormAction | null>(
    null,
  );
  const { resetStarted, trackStarted } =
    useContactFormStartTracking(analyticsPlacement);
  const callAnalytics = useContactFormAnalytics({
    form: AnalyticsFormId.DiscoveryCall,
    placement: analyticsPlacement,
  });
  const emailAnalytics = useContactFormAnalytics({
    form: AnalyticsFormId.QuickContact,
    placement: analyticsPlacement,
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
      const isCurrentRequest = beginRequest();
      setStatusMessage(null);

      if (values.honeypot.trim()) {
        // Silent success: the bot gets no signal that it was filtered.
        setStatusMessage(formCopy.emailSubmitSuccess);
        reset(DEFAULT_CONTACT_FORM_VALUES);
        return;
      }

      setPendingAction(ContactFormAction.Email);

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
        if (!isCurrentRequest()) {
          return;
        }

        if (!response.ok) {
          setStatusMessage(
            getSubmitErrorMessage(response, ContactFormAction.Email),
          );
          emailAnalytics.trackFailed(getContactSubmitFailureReason(response));
          return;
        }

        emailAnalytics.trackCompleted();
        reset(DEFAULT_CONTACT_FORM_VALUES);
        resetStarted();
        window.location.assign(
          createLocalePathname(SITE_ROUTES.SUCCESS, locale),
        );
      } catch {
        if (!isCurrentRequest()) {
          return;
        }
        setStatusMessage(formCopy.submitErrorGeneric);
        emailAnalytics.trackFailed(AnalyticsFormFailureReason.Generic);
      } finally {
        if (isCurrentRequest()) {
          setPendingAction(null);
        }
      }
    },
    (invalidFields) => {
      setPendingAction(null);
      emailAnalytics.trackInvalid(Object.keys(invalidFields));
    },
  );

  const handleEmailClick = () => {
    emailAnalytics.trackSubmitted();
    void handleEmailSubmit();
  };

  const handleCallSubmit: NonNullable<ComponentProps<"form">["onSubmit"]> = (
    event,
  ) => {
    event.preventDefault();
    setStatusMessage(null);
    callAnalytics.trackSubmitted();

    // Opened before the await so the browser still attributes it to the click.
    const pendingWindow = window.open("", "_blank");
    const isCurrentRequest = beginRequest();

    const submit = handleSubmit(
      async (values) => {
        if (!isCurrentRequest()) {
          pendingWindow?.close();
          return;
        }
        if (values.honeypot.trim()) {
          pendingWindow?.close();
          setStatusMessage(formCopy.callSubmitSuccess);
          reset(DEFAULT_CONTACT_FORM_VALUES);
          return;
        }

        setPendingAction(ContactFormAction.Call);

        const response = await submitDiscoveryCall(
          mapDiscoveryCallFormToDto(values, locale, origin),
          { submitPath },
        );
        // A stale request (form left or replaced) skips UI state and analytics,
        // but a saved lead still gets its booking tab.
        const isCurrent = isCurrentRequest();

        if (!response.ok) {
          pendingWindow?.close();
          if (!isCurrent) {
            return;
          }
          setPendingAction(null);
          setStatusMessage(getSubmitErrorMessage(response));
          callAnalytics.trackFailed(getContactSubmitFailureReason(response));
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
          if (!isCurrent) {
            return;
          }
          setPendingAction(null);
          setStatusMessage(formCopy.submitErrorGeneric);
          callAnalytics.trackFailed(AnalyticsFormFailureReason.Generic);
          return;
        }

        if (isCurrent) {
          setPendingAction(null);
          setStatusMessage(formCopy.callSubmitSuccess);
          callAnalytics.trackCompleted();
          callAnalytics.trackCalendarOpened();
        }

        if (pendingWindow) {
          pendingWindow.opener = null;
          pendingWindow.location.replace(calendlyPrefillHref);
        } else if (isCurrent) {
          window.location.assign(calendlyPrefillHref);
        }

        if (!isCurrent) {
          return;
        }
        reset(DEFAULT_CONTACT_FORM_VALUES);
        resetStarted();
      },
      async (invalidFields) => {
        pendingWindow?.close();
        setPendingAction(null);
        callAnalytics.trackInvalid(Object.keys(invalidFields));
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
          onInput={trackStarted}
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
                <PrimaryCtaButton disabled={isBusy} type="submit">
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
              disabled={isBusy}
              onClick={handleEmailClick}
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
