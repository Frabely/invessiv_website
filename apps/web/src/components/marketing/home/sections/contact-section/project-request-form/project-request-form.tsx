"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ContactConsentText } from "@/components/marketing/home/sections/contact-section/shared/contact-consent-text/contact-consent-text";
import { ContactIdentityFields } from "@/components/marketing/home/sections/contact-section/shared/contact-identity-fields/contact-identity-fields";
import sharedStyles from "@/components/marketing/home/sections/contact-section/shared/contact-form-primitives.module.css";
import { ContactFormShell } from "@/components/marketing/home/sections/contact-section/shared/contact-form-shell/contact-form-shell";
import { PrimaryCtaButton } from "@/components/shared/button/button";
import { FormActions } from "@/components/shared/form/form-actions/form-actions";
import { FormField } from "@/components/shared/form/form-field/form-field";
import { FormFieldLabel } from "@/components/shared/form/form-field-label/form-field-label";
import { FormStatus } from "@/components/shared/form/form-status/form-status";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import buttonStyles from "@/components/shared/button/button.module.css";
import { useLanguage } from "@/components/providers/language-provider";
import { mapProjectRequestFormToDto } from "@/client/contact/mappers/map-project-request-form-to-dto";
import { submitProjectRequest } from "@/client/contact/services/contact-form-service";
import { SECTION_HREFS } from "@/config/navigation/home";
import { DEFAULT_CONTACT_SUBMIT_PATH } from "@invessiv/common/constants/contact/contact-submit-path";
import { DEFAULT_PROJECT_REQUEST_FORM_VALUES } from "@invessiv/common/defaults/contact/project-request-form-values";
import type { ProjectRequestFormValues } from "@invessiv/common/contracts/contact/forms/project-request-form-values";
import type { ContactSubmitResponse } from "@invessiv/common/contracts/contact/submit/contact-submit";
import { useContactFormAnalytics } from "@/hooks/analytics/use-contact-form-analytics";
import { ContactFormSubmitErrorType } from "@/lib/analytics/contact-form-submit-error-type";
import { getContactSubmitAnalyticsErrorType } from "@/lib/analytics/contact-submit-error-type";
import {
  getCanonicalContactOfferKey,
  PROJECT_OFFER_CHANGE_EVENT,
} from "@/common/constants/marketing";
import {
  CONTACT_OFFER_KEY,
  CONTACT_OFFER_KEYS,
  type ContactOfferKey,
} from "@invessiv/common/constants/contact/contact-offer-keys";
import styles from "./project-request-form.module.css";

const CONTACT_PROJECT_LINK_SELECTOR = `a[href='${SECTION_HREFS.contact}'][data-project-offer]`;
const STEP_SEQUENCE = [1, 2, 3] as const;
const WEBSITE_PATTERN = /^https?:\/\/.+/i;
type FormStep = (typeof STEP_SEQUENCE)[number];
type FormOption = {
  key: string;
  label: string;
};

export type ContactFormCopy = {
  budgetLabel: string;
  budgetOptions: FormOption[];
  conditionalFieldHint: string;
  companyLabel: string;
  consentLabel: string;
  emailLabel: string;
  addPageLabel: string;
  goalLabel: string;
  goalOptions: FormOption[];
  intro: string;
  offerLabel: string;
  offerPlaceholder: string;
  pagesCustomLabel?: string;
  pagesCustomPlaceholder?: string;
  pagesCustomRemoveLabel?: string;
  pagesLabel: string;
  pagesOptions?: FormOption[];
  pagesPlaceholder: string;
  pagesRequiredHint?: string;
  offerGuidance?: FormOption[];
  phoneLabel: string;
  previousStepLabel: string;
  projectDetailsLabel: string;
  projectDetailsPlaceholder: string;
  projectDetailsPlaceholders?: FormOption[];
  requiredHint: string;
  roleLabel: string;
  startLabel: string;
  startOptions: FormOption[];
  stepLabel: string;
  stepNavigationLabel: string;
  stepOneTitle: string;
  stepThreeTitle: string;
  stepTwoTitle: string;
  submitErrorDelivery: string;
  submitErrorGeneric: string;
  submitErrorRateLimited: string;
  submitErrorValidation: string;
  validationSummaryPrefix: string;
  fieldErrorInvalidEmail: string;
  fieldErrorInvalidWebsite: string;
  fieldErrorRequired: string;
  fieldErrorProjectDetailsRequired: string;
  fieldErrorPagesRequired: string;
  fieldErrorTooManyPages: string;
  fieldErrorGoalRequired: string;
  fieldErrorWorkflowRequired: string;
  fieldErrorConsentRequired: string;
  submittingLabel: string;
  submitLabel: string;
  submitSuccess: string;
  subtitle: string;
  title: string;
  nameLabel: string;
  websiteLabel: string;
  workflowLabel: string;
  workflowOptions: FormOption[];
  nextStepLabel: string;
  nextStepContactLabel?: string;
  nextStepProjectLabel?: string;
};

type ProjectRequestFormProps = {
  formCopy: ContactFormCopy;
  offerOptions: Array<{ key: string; title: string }>;
  privacyHref: string;
  privacyLabel: string;
  submitPath?: string;
};

type ProjectOfferSyncDetail = {
  offerKey?: string;
  projectGoal?: string;
};

const isContactOfferKey = (value: string): value is ContactOfferKey =>
  CONTACT_OFFER_KEYS.includes(value as ContactOfferKey);

export function ProjectRequestForm({
  formCopy,
  offerOptions,
  privacyHref,
  privacyLabel,
  submitPath = DEFAULT_CONTACT_SUBMIT_PATH,
}: ProjectRequestFormProps) {
  const { locale } = useLanguage();
  const [customPageDraft, setCustomPageDraft] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<FormStep>(1);
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const [projectGoalSeed, setProjectGoalSeed] = useState("");
  const {
    resetFormAnalytics,
    trackFormStart,
    trackSubmitAttempt,
    trackSubmitError,
    trackSubmitSuccess,
  } = useContactFormAnalytics({
    formId: "project_request",
    location: "contact",
  });
  const {
    clearErrors,
    control,
    getValues,
    handleSubmit,
    register,
    reset,
    setError,
    setFocus,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<ProjectRequestFormValues>({
    defaultValues: DEFAULT_PROJECT_REQUEST_FORM_VALUES,
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  const selectedOfferKey = useWatch({
    control,
    name: "offerKey",
  });
  const selectedPageKeys = useWatch({
    control,
    name: "pageKeys",
  });
  const customPageNames = useWatch({
    control,
    name: "customPageNames",
  });

  const stepTitles = useMemo(
    () => [
      formCopy.stepOneTitle,
      formCopy.stepTwoTitle,
      formCopy.stepThreeTitle,
    ],
    [formCopy.stepOneTitle, formCopy.stepTwoTitle, formCopy.stepThreeTitle],
  );

  const stepOneNextLabel =
    formCopy.nextStepContactLabel ??
    `${formCopy.nextStepLabel} ${formCopy.stepTwoTitle}`;
  const stepTwoNextLabel =
    formCopy.nextStepProjectLabel ??
    `${formCopy.nextStepLabel} ${formCopy.stepThreeTitle}`;
  const ghostButtonClassName = `${buttonStyles.button} ${buttonStyles.ghost}`;
  const pagesCustomFieldClassName = `${styles.pagesCustom}`;

  const fieldRules = useMemo(() => {
    const webOfferKeys: ContactOfferKey[] = [
      CONTACT_OFFER_KEY.Landing,
      CONTACT_OFFER_KEY.Web,
      CONTACT_OFFER_KEY.Upgrade,
    ];
    const websiteRequiredKeys: ContactOfferKey[] = [
      CONTACT_OFFER_KEY.Upgrade,
      CONTACT_OFFER_KEY.Maintenance,
    ];
    const isWebOffer = webOfferKeys.includes(
      selectedOfferKey as ContactOfferKey,
    );

    return {
      requiresGoal: isWebOffer,
      requiresPages: isWebOffer,
      requiresWebsite: websiteRequiredKeys.includes(
        selectedOfferKey as ContactOfferKey,
      ),
      showsWebsite:
        isWebOffer ||
        websiteRequiredKeys.includes(selectedOfferKey as ContactOfferKey),
      requiresWorkflow: selectedOfferKey === CONTACT_OFFER_KEY.Process,
    };
  }, [selectedOfferKey]);

  const getOptionLabel = useCallback(
    (options: FormOption[] | undefined, optionKey: string | undefined) =>
      options?.find((option) => option.key === optionKey)?.label,
    [],
  );

  const selectedOfferGuidance = getOptionLabel(
    formCopy.offerGuidance,
    selectedOfferKey,
  );
  const projectDetailsPlaceholder =
    getOptionLabel(formCopy.projectDetailsPlaceholders, selectedOfferKey) ??
    formCopy.projectDetailsPlaceholder;

  const getValidOfferKey = useCallback(
    (value: string | null | undefined) => {
      if (!value) {
        return "";
      }

      const normalizedValue = value.toLowerCase();
      const canonicalOfferKey = isContactOfferKey(normalizedValue)
        ? getCanonicalContactOfferKey(normalizedValue)
        : normalizedValue;

      return offerOptions.some((option) => option.key === canonicalOfferKey)
        ? canonicalOfferKey
        : "";
    },
    [offerOptions],
  );

  const focusStep = useCallback(
    (step: FormStep) => {
      window.requestAnimationFrame(() => {
        if (step === 1) {
          const hasIdentity = getValues("displayName").trim().length > 0;
          setFocus(hasIdentity ? "offerKey" : "displayName");
          return;
        }

        if (step === 2) {
          if (fieldRules.requiresWebsite) {
            setFocus("website");
            return;
          }
          if (fieldRules.requiresGoal) {
            setFocus("goalKey");
            return;
          }
          if (fieldRules.requiresWorkflow) {
            setFocus("workflowKey");
            return;
          }
          setFocus("projectDetails");
          return;
        }

        setFocus("consentAccepted");
      });
    },
    [fieldRules, getValues, setFocus],
  );

  const getFieldStep = (fieldName: string): FormStep => {
    if (["displayName", "email", "offerKey"].includes(fieldName)) {
      return 1;
    }

    if (
      [
        "goalKey",
        "pageKeys",
        "projectDetails",
        "website",
        "workflowKey",
      ].includes(fieldName)
    ) {
      return 2;
    }

    return 3;
  };

  const getFieldErrorTextByCode = useCallback(
    (code: string | undefined) => {
      const mappedMessages: Record<string, string> = {
        consent_required: formCopy.fieldErrorConsentRequired,
        goal_required: formCopy.fieldErrorRequired,
        invalid_email: formCopy.fieldErrorInvalidEmail,
        invalid_website: formCopy.fieldErrorInvalidWebsite,
        pages_required:
          formCopy.pagesRequiredHint ?? formCopy.fieldErrorPagesRequired,
        too_many_pages: formCopy.fieldErrorTooManyPages,
        project_details_required: formCopy.fieldErrorProjectDetailsRequired,
        required: formCopy.fieldErrorRequired,
        website_required: formCopy.fieldErrorRequired,
        workflow_required: formCopy.fieldErrorRequired,
      };

      return mappedMessages[String(code)] ?? formCopy.fieldErrorRequired;
    },
    [
      formCopy.fieldErrorConsentRequired,
      formCopy.fieldErrorInvalidEmail,
      formCopy.fieldErrorInvalidWebsite,
      formCopy.fieldErrorPagesRequired,
      formCopy.fieldErrorProjectDetailsRequired,
      formCopy.fieldErrorTooManyPages,
      formCopy.fieldErrorRequired,
      formCopy.pagesRequiredHint,
    ],
  );

  const getFieldErrorText = useCallback(
    (fieldName: string) => {
      const fieldError = errors[fieldName as keyof ProjectRequestFormValues];
      const code = fieldError?.message ?? fieldError?.type;
      return getFieldErrorTextByCode(code);
    },
    [errors, getFieldErrorTextByCode],
  );

  const validatePagesSelection = useCallback(() => {
    if (!fieldRules.requiresPages) {
      clearErrors("pageKeys");
      return true;
    }

    const hasSelectedPages =
      (getValues("pageKeys")?.length ?? 0) > 0 ||
      (getValues("customPageNames")?.length ?? 0) > 0;

    if (hasSelectedPages) {
      clearErrors("pageKeys");
      return true;
    }

    setError("pageKeys", {
      message: "pages_required",
      type: "pages_required",
    });
    return false;
  }, [clearErrors, fieldRules.requiresPages, getValues, setError]);

  const validateStep = useCallback(
    async (step: FormStep) => {
      const fieldsByStep: Record<
        FormStep,
        Array<keyof ProjectRequestFormValues>
      > = {
        1: ["displayName", "email", "offerKey"],
        2: ["projectDetails"],
        3: ["consentAccepted"],
      };

      const stepFields = [...fieldsByStep[step]];

      if (step === 2) {
        if (fieldRules.showsWebsite) {
          stepFields.push("website");
        }
        if (fieldRules.requiresGoal) {
          stepFields.push("goalKey");
        }
        if (fieldRules.requiresWorkflow) {
          stepFields.push("workflowKey");
        }
      }

      const isStepValid = await trigger(stepFields);
      const hasValidPages = step === 2 ? validatePagesSelection() : true;
      return isStepValid && hasValidPages;
    },
    [fieldRules, trigger, validatePagesSelection],
  );

  const setStep = useCallback(
    (step: FormStep) => {
      setCurrentStep(step);
      setStatusMessage(null);
      focusStep(step);
    },
    [focusStep],
  );

  const applyOfferSelection = useCallback(
    (nextOfferKey: string) => {
      setValue("offerKey", nextOfferKey, { shouldDirty: true });
      setStatusMessage(null);

      if (nextOfferKey !== CONTACT_OFFER_KEY.Landing) {
        setValue("goalKey", "");
        clearErrors("goalKey");
      }

      if (nextOfferKey !== CONTACT_OFFER_KEY.Process) {
        setValue("workflowKey", "");
        clearErrors("workflowKey");
      }

      if (nextOfferKey !== CONTACT_OFFER_KEY.Landing) {
        setValue("pageKeys", []);
        setValue("customPageNames", []);
        setCustomPageDraft("");
        clearErrors("pageKeys");
      }

      if (
        !(
          [
            CONTACT_OFFER_KEY.Landing,
            CONTACT_OFFER_KEY.Web,
            CONTACT_OFFER_KEY.Upgrade,
            CONTACT_OFFER_KEY.Maintenance,
          ] as ContactOfferKey[]
        ).includes(nextOfferKey as ContactOfferKey)
      ) {
        clearErrors("website");
      }
    },
    [clearErrors, setValue],
  );

  const addCustomPage = useCallback(() => {
    const normalizedValue = customPageDraft.trim().replace(/\s+/g, " ");

    if (!normalizedValue) {
      return;
    }

    const currentValues = getValues("customPageNames") ?? [];
    if (currentValues.length >= 12) {
      setError("pageKeys", {
        message: "too_many_pages",
        type: "too_many_pages",
      });
      return;
    }

    const alreadyExists = currentValues.some(
      (value) =>
        value.toLocaleLowerCase() === normalizedValue.toLocaleLowerCase(),
    );

    if (alreadyExists) {
      setCustomPageDraft("");
      clearErrors("pageKeys");
      return;
    }

    setValue("customPageNames", [...currentValues, normalizedValue], {
      shouldDirty: true,
      shouldValidate: false,
    });
    setCustomPageDraft("");
    clearErrors("pageKeys");
  }, [clearErrors, customPageDraft, getValues, setError, setValue]);

  const removeCustomPage = useCallback(
    (pageName: string) => {
      setValue(
        "customPageNames",
        (getValues("customPageNames") ?? []).filter(
          (value) => value !== pageName,
        ),
        {
          shouldDirty: true,
          shouldValidate: false,
        },
      );
    },
    [getValues, setValue],
  );

  const applyProjectGoalSeed = useCallback(
    (nextProjectGoal: string) => {
      const normalizedGoal = nextProjectGoal.trim();
      const currentValue = getValues("projectDetails").trim();
      const previousSeed = projectGoalSeed.trim();

      if (!normalizedGoal) {
        if (currentValue === previousSeed) {
          setValue("projectDetails", "");
        }
        setProjectGoalSeed("");
        return;
      }

      if (!currentValue || currentValue === previousSeed) {
        setValue("projectDetails", normalizedGoal);
        setProjectGoalSeed(normalizedGoal);
      }
    },
    [getValues, projectGoalSeed, setValue],
  );

  const togglePageOption = (optionKey: string) => {
    const isSelected = selectedPageKeys.includes(optionKey);
    const nextSelection = isSelected
      ? selectedPageKeys.filter((item) => item !== optionKey)
      : [...selectedPageKeys, optionKey];

    setValue("pageKeys", nextSelection, {
      shouldDirty: true,
      shouldValidate: false,
    });
    clearErrors("pageKeys");
  };

  const goToNextStep = async () => {
    if (!(await validateStep(currentStep))) {
      return;
    }

    const nextStep = Math.min(
      currentStep + 1,
      STEP_SEQUENCE.length,
    ) as FormStep;
    if (nextStep !== currentStep) {
      setStep(nextStep);
    }
  };

  const goToPreviousStep = () => {
    const previousStep = Math.max(currentStep - 1, 1) as FormStep;
    if (previousStep !== currentStep) {
      setStep(previousStep);
    }
  };

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const contactAnchor = target.closest(CONTACT_PROJECT_LINK_SELECTOR);
      if (!(contactAnchor instanceof HTMLAnchorElement)) {
        return;
      }

      const nextOfferKey = getValidOfferKey(
        contactAnchor.dataset.projectOffer ?? "",
      );
      const nextProjectGoal = contactAnchor.dataset.projectGoal ?? "";

      reset(DEFAULT_PROJECT_REQUEST_FORM_VALUES);
      resetFormAnalytics();
      setProjectGoalSeed("");
      setStartedAt(new Date().toISOString());
      setStatusMessage(null);
      setCurrentStep(1);
      applyOfferSelection(nextOfferKey);
      applyProjectGoalSeed(nextProjectGoal);
      focusStep(1);
    };

    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, [
    applyOfferSelection,
    applyProjectGoalSeed,
    focusStep,
    getValidOfferKey,
    reset,
    resetFormAnalytics,
  ]);

  useEffect(() => {
    const handleOfferSync = (event: Event) => {
      const detail = (event as CustomEvent<ProjectOfferSyncDetail>).detail;
      const nextOfferKey = getValidOfferKey(detail?.offerKey ?? "");

      if (nextOfferKey) {
        applyOfferSelection(nextOfferKey);
      }

      applyProjectGoalSeed(detail?.projectGoal ?? "");
    };

    window.addEventListener(
      PROJECT_OFFER_CHANGE_EVENT,
      handleOfferSync as EventListener,
    );

    return () => {
      window.removeEventListener(
        PROJECT_OFFER_CHANGE_EVENT,
        handleOfferSync as EventListener,
      );
    };
  }, [applyOfferSelection, applyProjectGoalSeed, getValidOfferKey]);

  const getSubmitErrorMessage = (
    response: Extract<ContactSubmitResponse, { ok: false }>,
  ) => {
    if (response.code === "rate_limited") {
      return formCopy.submitErrorRateLimited;
    }

    if (response.code === "delivery_unavailable") {
      return formCopy.submitErrorDelivery;
    }

    if (
      response.code === "validation_error" ||
      response.code === "spam_detected"
    ) {
      return formCopy.submitErrorValidation;
    }

    return formCopy.submitErrorGeneric;
  };

  const onSubmit = handleSubmit(async (values) => {
    for (const step of STEP_SEQUENCE) {
      const isStepValid = await validateStep(step);
      if (!isStepValid) {
        trackSubmitError(ContactFormSubmitErrorType.Validation, {
          step: String(step),
        });
        setStep(step);
        return;
      }
    }

    const dto = mapProjectRequestFormToDto(values, {
      locale,
      startedAt,
    });

    setStatusMessage(formCopy.submittingLabel);
    trackSubmitAttempt({ step: String(currentStep) });

    try {
      const payload = await submitProjectRequest(dto, {
        submitPath,
      });
      if (!payload.ok) {
        if (!payload.ok && payload.fieldErrors) {
          const firstInvalidField = Object.keys(payload.fieldErrors)[0];
          if (firstInvalidField) {
            for (const [fieldName, messages] of Object.entries(
              payload.fieldErrors,
            )) {
              setError(fieldName as keyof ProjectRequestFormValues, {
                message: messages[0],
                type: messages[0],
              });
            }

            setStep(getFieldStep(firstInvalidField));
            setStatusMessage(
              `${formCopy.validationSummaryPrefix}: ${getFieldErrorTextByCode(payload.fieldErrors[firstInvalidField]?.[0])}`,
            );
            trackSubmitError(ContactFormSubmitErrorType.Validation, {
              step: String(getFieldStep(firstInvalidField)),
            });
            return;
          }
        }

        setStatusMessage(
          payload.ok
            ? formCopy.submitErrorGeneric
            : getSubmitErrorMessage(payload),
        );
        trackSubmitError(getContactSubmitAnalyticsErrorType(payload));
        return;
      }

      trackSubmitSuccess({ step: String(currentStep) });
      setStatusMessage(formCopy.submitSuccess);
      setProjectGoalSeed("");
      reset(DEFAULT_PROJECT_REQUEST_FORM_VALUES);
      resetFormAnalytics();
      setCurrentStep(1);
      setStartedAt(new Date().toISOString());
      window.requestAnimationFrame(() => setFocus("displayName"));
    } catch {
      setStatusMessage(formCopy.submitErrorGeneric);
      trackSubmitError(ContactFormSubmitErrorType.Generic);
    }
  });

  return (
    <ContactFormShell
      footer={<FormStatus message={statusMessage} />}
      intro={formCopy.intro}
      subtitle={formCopy.subtitle}
      title={formCopy.title}
    >
      <div data-project-request="true" data-project-request-panel="true">
        <ol
          aria-label={formCopy.stepNavigationLabel}
          className={styles.stepper}
        >
          {stepTitles.map((title, index) => {
            const step = STEP_SEQUENCE[index];
            const isDone = step < currentStep;
            const isCurrent = step === currentStep;
            const stepperItemClassName = `${styles.stepperItem}${isDone ? ` ${styles.stepperItemDone}` : ""}${isCurrent ? ` ${styles.stepperItemCurrent}` : ""}`;

            return (
              <li className={stepperItemClassName} key={`${title}-${step}`}>
                <button
                  aria-current={isCurrent ? "step" : undefined}
                  className={styles.stepperTrigger}
                  disabled={step > currentStep || isSubmitting}
                  onClick={() => {
                    if (step < currentStep) {
                      setStep(step);
                    }
                  }}
                  type="button"
                >
                  <span className={styles.stepperIndex}>
                    {isDone ? (
                      <span aria-hidden="true" className={styles.stepperCheck}>
                        ✓
                      </span>
                    ) : (
                      step
                    )}
                  </span>
                  <span className={styles.stepperCopy}>
                    <small>
                      {formCopy.stepLabel} {step}
                    </small>
                    <strong>{title}</strong>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <form
          className={`${sharedStyles.form} ${styles.form}`}
          noValidate
          onFocusCapture={() => trackFormStart({ step: String(currentStep) })}
          onSubmit={onSubmit}
        >
          <input
            aria-hidden="true"
            autoComplete="off"
            className="sr-only"
            tabIndex={-1}
            type="text"
            {...register("websiteTrap")}
          />

          <fieldset
            className={styles.step}
            data-step="1"
            hidden={currentStep !== 1}
          >
            <legend>{formCopy.stepOneTitle}</legend>

            <ContactIdentityFields
              copy={formCopy}
              errors={errors}
              getErrorMessage={(fieldName) => getFieldErrorText(fieldName)}
              onFieldChange={{
                displayName: () => clearErrors("displayName"),
                email: () => clearErrors("email"),
              }}
              register={register}
            />

            <div className={styles.stepOneOfferStack}>
              <FormField
                className={styles.fieldOfferLayout}
                errorMessage={
                  errors.offerKey ? getFieldErrorText("offerKey") : undefined
                }
                kind={FormFieldKind.Select}
                label={formCopy.offerLabel}
                options={[
                  {
                    label: formCopy.offerPlaceholder,
                    value: "",
                  },
                  ...offerOptions.map((option) => ({
                    label: option.title,
                    value: option.key,
                  })),
                ]}
                required
                selectProps={{
                  ...register("offerKey", {
                    onChange: (event) => {
                      applyOfferSelection(event.target.value);
                      clearErrors([
                        "offerKey",
                        "goalKey",
                        "pageKeys",
                        "website",
                      ]);
                    },
                    required: "required",
                  }),
                  "aria-invalid": errors.offerKey ? "true" : undefined,
                  "data-empty": selectedOfferKey ? "false" : "true",
                }}
              />

              <p className={styles.conditionalHint}>
                {formCopy.conditionalFieldHint}
              </p>

              <p className={styles.stepOneRequiredHint}>
                {formCopy.requiredHint}
              </p>
            </div>

            <FormActions
              buttons={
                <PrimaryCtaButton
                  disabled={isSubmitting}
                  onClick={goToNextStep}
                  type="button"
                >
                  {stepOneNextLabel}
                </PrimaryCtaButton>
              }
            />
          </fieldset>

          <fieldset
            className={styles.step}
            data-step="2"
            hidden={currentStep !== 2}
          >
            <legend>{formCopy.stepTwoTitle}</legend>

            {fieldRules.showsWebsite ? (
              <FormField
                errorMessage={
                  errors.website ? getFieldErrorText("website") : undefined
                }
                inputProps={{
                  ...register("website", {
                    pattern: {
                      message: "invalid_website",
                      value: WEBSITE_PATTERN,
                    },
                    required: fieldRules.requiresWebsite
                      ? "website_required"
                      : false,
                  }),
                  "aria-invalid": errors.website ? "true" : undefined,
                  autoComplete: "url",
                }}
                kind={FormFieldKind.Url}
                label={formCopy.websiteLabel}
                required={fieldRules.requiresWebsite}
              />
            ) : null}

            {selectedOfferGuidance ? (
              <p className={styles.conditionalHint}>{selectedOfferGuidance}</p>
            ) : null}

            {fieldRules.requiresGoal ? (
              <FormField
                errorMessage={
                  errors.goalKey ? getFieldErrorText("goalKey") : undefined
                }
                kind={FormFieldKind.Select}
                label={formCopy.goalLabel}
                options={[
                  { label: "-", value: "" },
                  ...formCopy.goalOptions.map((option) => ({
                    label: option.label,
                    value: option.key,
                  })),
                ]}
                required
                selectProps={{
                  ...register("goalKey", { required: "goal_required" }),
                  "aria-invalid": errors.goalKey ? "true" : undefined,
                }}
              />
            ) : null}

            {fieldRules.requiresPages ? (
              <div className={styles.pages} tabIndex={-1}>
                <p className={styles.pagesLabel}>
                  <FormFieldLabel label={formCopy.pagesLabel} required />
                </p>
                <div className={styles.pagesOptions}>
                  {formCopy.pagesOptions?.map((option) => {
                    const isSelected = selectedPageKeys.includes(option.key);
                    const pageOptionClassName = `${styles.pageOption}${isSelected ? ` ${styles.pageOptionSelected}` : ""}`;

                    return (
                      <button
                        aria-pressed={isSelected}
                        className={pageOptionClassName}
                        key={option.key}
                        onClick={() => togglePageOption(option.key)}
                        type="button"
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>

                {customPageNames.length > 0 ? (
                  <div className={styles.pagesOptions}>
                    {customPageNames.map((pageName) => (
                      <button
                        className={`${styles.pageOption} ${styles.pageOptionSelected} ${styles.customPageOption}`}
                        key={pageName}
                        onClick={() => removeCustomPage(pageName)}
                        type="button"
                      >
                        <span>{pageName}</span>
                        <span
                          aria-hidden="true"
                          className={styles.customPageRemove}
                        >
                          ×
                        </span>
                        <span className="sr-only">
                          {formCopy.pagesCustomRemoveLabel ??
                            `Seite entfernen: ${pageName}`}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className={styles.customPageComposer}>
                  <FormField
                    className={pagesCustomFieldClassName}
                    errorMessage={
                      errors.pageKeys
                        ? getFieldErrorText("pageKeys")
                        : undefined
                    }
                    inputProps={{
                      "aria-invalid": errors.pageKeys ? "true" : undefined,
                      id: "project-request-custom-page-input",
                      onChange: (event) => {
                        setCustomPageDraft(event.target.value);
                        clearErrors("pageKeys");
                      },
                      onKeyDown: (event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addCustomPage();
                        }
                      },
                      placeholder:
                        formCopy.pagesCustomPlaceholder ??
                        formCopy.pagesPlaceholder,
                      value: customPageDraft,
                    }}
                    kind={FormFieldKind.Text}
                    label={
                      formCopy.pagesCustomLabel ??
                      "Weitere Seite hinzufügen (optional)"
                    }
                  />
                  <button
                    className={styles.addPageButton}
                    disabled={!customPageDraft.trim()}
                    onClick={addCustomPage}
                    type="button"
                  >
                    {formCopy.addPageLabel}
                  </button>
                </div>
              </div>
            ) : null}

            {fieldRules.requiresWorkflow ? (
              <FormField
                errorMessage={
                  errors.workflowKey
                    ? getFieldErrorText("workflowKey")
                    : undefined
                }
                kind={FormFieldKind.Select}
                label={formCopy.workflowLabel}
                options={[
                  { label: "-", value: "" },
                  ...formCopy.workflowOptions.map((option) => ({
                    label: option.label,
                    value: option.key,
                  })),
                ]}
                required
                selectProps={{
                  ...register("workflowKey", { required: "workflow_required" }),
                  "aria-invalid": errors.workflowKey ? "true" : undefined,
                }}
              />
            ) : null}

            <FormField
              errorMessage={
                errors.projectDetails
                  ? getFieldErrorText("projectDetails")
                  : undefined
              }
              kind={FormFieldKind.Textarea}
              label={formCopy.projectDetailsLabel}
              required
              textareaProps={{
                ...register("projectDetails", {
                  required: "project_details_required",
                  validate: (value) =>
                    value.trim().length > 0 || "project_details_required",
                }),
                "aria-invalid": errors.projectDetails ? "true" : undefined,
                placeholder: projectDetailsPlaceholder,
                rows: 5,
              }}
            />

            <FormActions
              buttons={
                <>
                  <button
                    className={ghostButtonClassName}
                    disabled={isSubmitting}
                    onClick={goToPreviousStep}
                    type="button"
                  >
                    {formCopy.previousStepLabel}
                  </button>
                  <PrimaryCtaButton
                    disabled={isSubmitting}
                    onClick={goToNextStep}
                    type="button"
                  >
                    {stepTwoNextLabel}
                  </PrimaryCtaButton>
                </>
              }
              requiredHint={formCopy.requiredHint}
            />
          </fieldset>

          <fieldset
            className={styles.step}
            data-step="3"
            hidden={currentStep !== 3}
          >
            <legend>{formCopy.stepThreeTitle}</legend>

            <div
              className={`${sharedStyles.grid} ${sharedStyles.gridTwo} ${styles.grid}`}
            >
              <FormField
                inputProps={{
                  ...register("company"),
                  autoCapitalize: "words",
                  autoComplete: "organization",
                }}
                kind={FormFieldKind.Text}
                label={formCopy.companyLabel}
              />

              <FormField
                inputProps={{
                  ...register("role"),
                  autoCapitalize: "words",
                  autoComplete: "organization-title",
                }}
                kind={FormFieldKind.Text}
                label={formCopy.roleLabel}
              />
            </div>

            <FormField
              inputProps={{
                ...register("phone"),
                autoComplete: "tel",
              }}
              kind={FormFieldKind.Tel}
              label={formCopy.phoneLabel}
            />

            <div
              className={`${sharedStyles.grid} ${sharedStyles.gridTwo} ${styles.grid}`}
            >
              <FormField
                kind={FormFieldKind.Select}
                label={formCopy.budgetLabel}
                options={[
                  { label: "-", value: "" },
                  ...formCopy.budgetOptions.map((option) => ({
                    label: option.label,
                    value: option.key,
                  })),
                ]}
                selectProps={register("budgetKey")}
              />

              <FormField
                kind={FormFieldKind.Select}
                label={formCopy.startLabel}
                options={[
                  { label: "-", value: "" },
                  ...formCopy.startOptions.map((option) => ({
                    label: option.label,
                    value: option.key,
                  })),
                ]}
                selectProps={register("preferredStartKey")}
              />
            </div>

            <label className={sharedStyles.consent}>
              <input
                aria-describedby="project-request-consent-error"
                aria-invalid={errors.consentAccepted ? "true" : undefined}
                type="checkbox"
                {...register("consentAccepted", {
                  validate: (value) => value || "consent_required",
                })}
              />
              <ContactConsentText
                consentLabel={formCopy.consentLabel}
                errorClassName={sharedStyles.consentError}
                errorId="project-request-consent-error"
                errorMessage={
                  errors.consentAccepted
                    ? getFieldErrorText("consentAccepted")
                    : undefined
                }
                privacyHref={privacyHref}
                privacyLabel={privacyLabel}
              />
            </label>

            <FormActions
              buttons={
                <>
                  <button
                    className={ghostButtonClassName}
                    disabled={isSubmitting}
                    onClick={goToPreviousStep}
                    type="button"
                  >
                    {formCopy.previousStepLabel}
                  </button>
                  <PrimaryCtaButton disabled={isSubmitting} type="submit">
                    {isSubmitting
                      ? formCopy.submittingLabel
                      : formCopy.submitLabel}
                  </PrimaryCtaButton>
                </>
              }
              layout="stacked"
              requiredHint={formCopy.requiredHint}
            />
          </fieldset>
        </form>
      </div>
    </ContactFormShell>
  );
}
