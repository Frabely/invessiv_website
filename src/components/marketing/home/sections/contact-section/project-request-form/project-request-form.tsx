"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ContactConsentText } from "@/components/marketing/home/sections/contact-section/components/contact-consent-text";
import { ContactFormActions } from "@/components/marketing/home/sections/contact-section/components/contact-form-actions";
import { ContactFormField } from "@/components/marketing/home/sections/contact-section/components/contact-form-field";
import { ContactIdentityFields } from "@/components/marketing/home/sections/contact-section/components/contact-identity-fields";
import { ContactFormShell } from "@/components/marketing/home/sections/contact-section/components/contact-form-shell";
import { ContactFormStatus } from "@/components/marketing/home/sections/contact-section/components/contact-form-status";
import { PrimaryCtaButton } from "@/components/shared/button/button";
import buttonStyles from "@/components/shared/button/button.module.css";
import { useLanguage } from "@/components/providers/language-provider";
import { SECTION_HREFS } from "@/config/site";
import {
  DEFAULT_CONTACT_SUBMIT_PATH,
  submitProjectRequest,
} from "@/features/contact/client/contact-form-service";
import { mapProjectRequestFormToDto } from "@/features/contact/client/map-project-request-form-to-dto";
import {
  DEFAULT_PROJECT_REQUEST_FORM_VALUES,
  type ProjectRequestFormValues,
} from "@/features/contact/client/project-request-form.schema";
import type { ContactSubmitResponse } from "@/features/contact/contact.contract";
import { trackConversionEvent } from "@/lib/analytics/conversion-events";
import styles from "./project-request-form.module.css";

const CONTACT_PROJECT_LINK_SELECTOR = `a[href='${SECTION_HREFS.contact}'][data-project-offer]`;
const STEP_SEQUENCE = [1, 2, 3] as const;
const WEBSITE_PATTERN = /^https?:\/\/.+/i;
type FormStep = (typeof STEP_SEQUENCE)[number];
type FormOption = {
  key: string;
  label: string;
};

type ContactFormCopy = {
  budgetLabel: string;
  budgetOptions: FormOption[];
  conditionalFieldHint: string;
  companyLabel: string;
  consentLabel: string;
  emailLabel: string;
  firstNameLabel: string;
  goalLabel: string;
  goalOptions: FormOption[];
  intro: string;
  offerLabel: string;
  offerPlaceholder: string;
  pagesCustomLabel?: string;
  pagesCustomPlaceholder?: string;
  pagesLabel: string;
  pagesOptions?: FormOption[];
  pagesPlaceholder: string;
  pagesRequiredHint?: string;
  phoneLabel: string;
  previousStepLabel: string;
  projectDetailsLabel: string;
  projectDetailsPlaceholder: string;
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
  fieldErrorGoalRequired: string;
  fieldErrorWorkflowRequired: string;
  fieldErrorConsentRequired: string;
  submittingLabel: string;
  submitLabel: string;
  submitSuccess: string;
  subtitle: string;
  title: string;
  websiteLabel: string;
  websiteRequiredHint: string;
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

export function ProjectRequestForm({
  formCopy,
  offerOptions,
  privacyHref,
  privacyLabel,
  submitPath = DEFAULT_CONTACT_SUBMIT_PATH,
}: ProjectRequestFormProps) {
  const { locale } = useLanguage();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<FormStep>(1);
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const [projectGoalSeed, setProjectGoalSeed] = useState("");
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
  });

  const selectedOfferKey = useWatch({
    control,
    name: "offerKey",
  });
  const selectedPageKeys = useWatch({
    control,
    name: "pageKeys",
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
  const fieldOfferClassName = `${styles.fieldOfferLayout}`;
  const pagesCustomFieldClassName = `${styles.pagesCustom}`;

  const fieldRules = useMemo(() => {
    const websiteRequiredKeys = ["upgrade", "web", "maintenance"];
    return {
      requiresGoal: selectedOfferKey === "landing",
      requiresPages: selectedOfferKey === "web",
      requiresWebsite: websiteRequiredKeys.includes(selectedOfferKey),
      requiresWorkflow: selectedOfferKey === "process",
    };
  }, [selectedOfferKey]);

  const getValidOfferKey = useCallback(
    (value: string | null | undefined) => {
      if (!value) {
        return "";
      }

      const normalizedValue = value.toLowerCase();
      return offerOptions.some((option) => option.key === normalizedValue)
        ? normalizedValue
        : "";
    },
    [offerOptions],
  );

  const focusStep = useCallback(
    (step: FormStep) => {
      window.requestAnimationFrame(() => {
        if (step === 1) {
          setFocus(getValues("fullName") ? "offerKey" : "fullName");
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
          if (fieldRules.requiresPages) {
            setFocus("pagesCustom");
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
    if (["fullName", "email", "offerKey"].includes(fieldName)) {
      return 1;
    }

    if (
      [
        "goalKey",
        "pageKeys",
        "pagesCustom",
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
      getValues("pagesCustom").trim().length > 0;

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
        1: ["fullName", "email", "offerKey"],
        2: ["projectDetails"],
        3: ["consentAccepted"],
      };

      const stepFields = [...fieldsByStep[step]];

      if (step === 2) {
        if (fieldRules.requiresWebsite) {
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

      if (nextOfferKey !== "landing") {
        setValue("goalKey", "");
        clearErrors("goalKey");
      }

      if (nextOfferKey !== "process") {
        setValue("workflowKey", "");
        clearErrors("workflowKey");
      }

      if (nextOfferKey !== "web") {
        setValue("pageKeys", []);
        setValue("pagesCustom", "");
        clearErrors("pageKeys");
      }

      if (!["upgrade", "web", "maintenance"].includes(nextOfferKey)) {
        clearErrors("website");
      }
    },
    [clearErrors, setValue],
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
    const nextSelection = selectedPageKeys.includes(optionKey)
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
      "invessiv:project-offer-change",
      handleOfferSync as EventListener,
    );

    return () => {
      window.removeEventListener(
        "invessiv:project-offer-change",
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
        setStep(step);
        return;
      }
    }

    const dto = mapProjectRequestFormToDto(values, {
      locale,
      startedAt,
    });

    setStatusMessage(formCopy.submittingLabel);

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
            return;
          }
        }

        setStatusMessage(
          payload.ok
            ? formCopy.submitErrorGeneric
            : getSubmitErrorMessage(payload),
        );
        return;
      }

      trackConversionEvent("lead_submit_success", {
        location: "contact",
        target: "form",
        variant: "primary",
      });
      setStatusMessage(formCopy.submitSuccess);
      setProjectGoalSeed("");
      reset(DEFAULT_PROJECT_REQUEST_FORM_VALUES);
      setCurrentStep(1);
      setStartedAt(new Date().toISOString());
      window.requestAnimationFrame(() => setFocus("fullName"));
    } catch {
      setStatusMessage(formCopy.submitErrorGeneric);
    }
  });

  return (
    <ContactFormShell
      footer={<ContactFormStatus message={statusMessage} />}
      intro={formCopy.intro}
      subtitle={formCopy.subtitle}
      title={formCopy.title}
    >
      <div data-project-request="true">
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
                  <span className={styles.stepperIndex}>{step}</span>
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

        <form className={styles.form} noValidate onSubmit={onSubmit}>
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

            <div className={`${styles.grid} ${styles.gridTwo}`}>
              <ContactIdentityFields
                copy={{
                  emailLabel: formCopy.emailLabel,
                  fullNameLabel: formCopy.firstNameLabel,
                }}
                errors={errors}
                getErrorMessage={(fieldName) => getFieldErrorText(fieldName)}
                onFieldChange={{
                  email: () => clearErrors("email"),
                  fullName: () => clearErrors("fullName"),
                }}
                register={register}
              />
            </div>

            <ContactFormField
              className={fieldOfferClassName}
              errorMessage={
                errors.offerKey ? getFieldErrorText("offerKey") : undefined
              }
              kind="select"
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
                    clearErrors(["offerKey", "goalKey", "pageKeys", "website"]);
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

            <ContactFormActions
              buttons={
                <PrimaryCtaButton
                  disabled={isSubmitting}
                  onClick={goToNextStep}
                  type="button"
                >
                  {stepOneNextLabel}
                </PrimaryCtaButton>
              }
              requiredHint={formCopy.requiredHint}
            />
          </fieldset>

          <fieldset
            className={styles.step}
            data-step="2"
            hidden={currentStep !== 2}
          >
            <legend>{formCopy.stepTwoTitle}</legend>

            {fieldRules.requiresWebsite ? (
              <ContactFormField
                errorMessage={
                  errors.website ? getFieldErrorText("website") : undefined
                }
                hint={formCopy.websiteRequiredHint}
                inputProps={{
                  ...register("website", {
                    pattern: {
                      message: "invalid_website",
                      value: WEBSITE_PATTERN,
                    },
                    required: "website_required",
                  }),
                  "aria-invalid": errors.website ? "true" : undefined,
                  autoComplete: "url",
                }}
                kind="url"
                label={formCopy.websiteLabel}
                required
              />
            ) : null}

            {fieldRules.requiresGoal ? (
              <ContactFormField
                errorMessage={
                  errors.goalKey ? getFieldErrorText("goalKey") : undefined
                }
                kind="select"
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
                <p className={styles.pagesLabel}>{formCopy.pagesLabel}*</p>
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

                <ContactFormField
                  className={pagesCustomFieldClassName}
                  errorMessage={
                    errors.pageKeys ? getFieldErrorText("pageKeys") : undefined
                  }
                  inputProps={{
                    ...register("pagesCustom", {
                      onChange: () => clearErrors("pageKeys"),
                    }),
                    "aria-invalid": errors.pageKeys ? "true" : undefined,
                    placeholder:
                      formCopy.pagesCustomPlaceholder ??
                      formCopy.pagesPlaceholder,
                  }}
                  kind="text"
                  label={
                    formCopy.pagesCustomLabel ?? "Weitere Seiten (optional)"
                  }
                />
              </div>
            ) : null}

            {fieldRules.requiresWorkflow ? (
              <ContactFormField
                errorMessage={
                  errors.workflowKey
                    ? getFieldErrorText("workflowKey")
                    : undefined
                }
                kind="select"
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

            <ContactFormField
              errorMessage={
                errors.projectDetails
                  ? getFieldErrorText("projectDetails")
                  : undefined
              }
              kind="textarea"
              label={formCopy.projectDetailsLabel}
              required
              textareaProps={{
                ...register("projectDetails", {
                  required: "project_details_required",
                  validate: (value) =>
                    value.trim().length > 0 || "project_details_required",
                }),
                "aria-invalid": errors.projectDetails ? "true" : undefined,
                placeholder: formCopy.projectDetailsPlaceholder,
                rows: 5,
              }}
            />

            <ContactFormActions
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

            <div className={`${styles.grid} ${styles.gridTwo}`}>
              <ContactFormField
                inputProps={{
                  ...register("company"),
                  autoCapitalize: "words",
                  autoComplete: "organization",
                }}
                kind="text"
                label={formCopy.companyLabel}
              />

              <ContactFormField
                inputProps={{
                  ...register("role"),
                  autoCapitalize: "words",
                  autoComplete: "organization-title",
                }}
                kind="text"
                label={formCopy.roleLabel}
              />
            </div>

            <ContactFormField
              inputProps={{
                ...register("phone"),
                autoComplete: "tel",
              }}
              kind="tel"
              label={formCopy.phoneLabel}
            />

            <div className={`${styles.grid} ${styles.gridTwo}`}>
              <ContactFormField
                kind="select"
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

              <ContactFormField
                kind="select"
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

            <label className={styles.consent}>
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
                errorClassName={styles.consentError}
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

            <ContactFormActions
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
