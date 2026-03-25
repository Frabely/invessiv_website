"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { SECTION_HREFS } from "@/config/site";
import type { ContactSubmitResponse } from "@/features/contact/contact.contract";
import { trackConversionEvent } from "@/lib/analytics/conversion-events";
import { useLanguage } from "@/components/providers/language-provider";

const DEFAULT_SUBMIT_PATH = "/api/public/contact";
const CONTACT_PROJECT_LINK_SELECTOR = `a[href='${SECTION_HREFS.contact}'][data-project-offer]`;
const STEP_SEQUENCE = [1, 2, 3] as const;

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
  submitPath = DEFAULT_SUBMIT_PATH,
}: ProjectRequestFormProps) {
  const { locale } = useLanguage();
  const [selectedOfferKey, setSelectedOfferKey] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<FormStep>(1);
  const [selectedPageKeys, setSelectedPageKeys] = useState<string[]>([]);
  const [pagesSelectionError, setPagesSelectionError] = useState<string | null>(
    null,
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const formRef = useRef<HTMLFormElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const offerSelectRef = useRef<HTMLSelectElement | null>(null);
  const websiteInputRef = useRef<HTMLInputElement | null>(null);
  const pagesCustomInputRef = useRef<HTMLInputElement | null>(null);
  const workflowSelectRef = useRef<HTMLSelectElement | null>(null);
  const goalSelectRef = useRef<HTMLSelectElement | null>(null);
  const projectDetailsRef = useRef<HTMLTextAreaElement | null>(null);
  const projectGoalSeedRef = useRef<string>("");
  const consentInputRef = useRef<HTMLInputElement | null>(null);
  const pagesOptionsContainerRef = useRef<HTMLDivElement | null>(null);

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

  const fieldRules = useMemo(() => {
    const websiteRequiredKeys = ["upgrade", "web", "maintenance"];
    return {
      requiresGoal: selectedOfferKey === "landing",
      requiresPages: selectedOfferKey === "web",
      requiresWebsite: websiteRequiredKeys.includes(selectedOfferKey),
      requiresWorkflow: selectedOfferKey === "process",
    };
  }, [selectedOfferKey]);

  const focusStep = useCallback(
    (step: FormStep) => {
      window.requestAnimationFrame(() => {
        if (step === 1) {
          if (nameInputRef.current && !nameInputRef.current.value) {
            nameInputRef.current.focus();
            return;
          }
          offerSelectRef.current?.focus();
          return;
        }

        if (step === 2) {
          if (fieldRules.requiresWebsite) {
            websiteInputRef.current?.focus();
            return;
          }
          if (fieldRules.requiresGoal) {
            goalSelectRef.current?.focus();
            return;
          }
          if (fieldRules.requiresPages) {
            pagesCustomInputRef.current?.focus();
            return;
          }
          if (fieldRules.requiresWorkflow) {
            workflowSelectRef.current?.focus();
            return;
          }
          projectDetailsRef.current?.focus();
          return;
        }

        consentInputRef.current?.focus();
      });
    },
    [
      fieldRules.requiresGoal,
      fieldRules.requiresPages,
      fieldRules.requiresWebsite,
      fieldRules.requiresWorkflow,
    ],
  );

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

  const togglePageOption = (optionKey: string) => {
    setSelectedPageKeys((previous) => {
      if (previous.includes(optionKey)) {
        return previous.filter((item) => item !== optionKey);
      }
      return [...previous, optionKey];
    });
    setPagesSelectionError(null);
    setFieldErrors((previous) => {
      if (!previous.pageKeys) {
        return previous;
      }

      const next = { ...previous };
      delete next.pageKeys;
      return next;
    });
  };

  const clearFieldError = useCallback((fieldName: string) => {
    setFieldErrors((previous) => {
      if (!previous[fieldName]) {
        return previous;
      }

      const next = { ...previous };
      delete next[fieldName];
      return next;
    });
  }, []);

  const applyOfferSelection = useCallback((nextOfferKey: string) => {
    setSelectedOfferKey(nextOfferKey);

    if (nextOfferKey === "web") {
      return;
    }

    setSelectedPageKeys([]);
    setPagesSelectionError(null);
    setFieldErrors({});
    if (pagesCustomInputRef.current) {
      pagesCustomInputRef.current.value = "";
    }
  }, []);

  const applyProjectGoalSeed = useCallback((nextProjectGoal: string) => {
    const normalizedGoal = nextProjectGoal.trim();
    const textarea = projectDetailsRef.current;

    if (!textarea) {
      projectGoalSeedRef.current = normalizedGoal;
      return;
    }

    const currentValue = textarea.value.trim();
    const previousSeed = projectGoalSeedRef.current.trim();

    if (!normalizedGoal) {
      if (currentValue === previousSeed) {
        textarea.value = "";
      }
      projectGoalSeedRef.current = "";
      return;
    }

    if (!currentValue || currentValue === previousSeed) {
      textarea.value = normalizedGoal;
      projectGoalSeedRef.current = normalizedGoal;
    }
  }, []);

  const validatePagesSelection = useCallback(() => {
    if (!fieldRules.requiresPages) {
      setPagesSelectionError(null);
      return true;
    }

    const customPagesValue = pagesCustomInputRef.current?.value.trim() ?? "";
    const hasSelectedPages =
      selectedPageKeys.length > 0 || customPagesValue.length > 0;

    if (hasSelectedPages) {
      setPagesSelectionError(null);
      return true;
    }

    setPagesSelectionError(
      formCopy.pagesRequiredHint ?? formCopy.fieldErrorPagesRequired,
    );
    pagesOptionsContainerRef.current?.focus();
    return false;
  }, [
    fieldRules.requiresPages,
    formCopy.fieldErrorPagesRequired,
    formCopy.pagesRequiredHint,
    selectedPageKeys.length,
  ]);

  const validateStep = useCallback(
    (step: FormStep) => {
      const form = formRef.current;
      if (!form) {
        return true;
      }

      const controls = Array.from(
        form.querySelectorAll<
          HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >(
          `[data-step="${step}"] input, [data-step="${step}"] select, [data-step="${step}"] textarea`,
        ),
      );

      for (const control of controls) {
        if (control.disabled || control.classList.contains("sr-only")) {
          continue;
        }

        if (!control.checkValidity()) {
          control.reportValidity();
          control.focus();
          return false;
        }
      }

      if (step === 2 && !validatePagesSelection()) {
        return false;
      }

      return true;
    },
    [validatePagesSelection],
  );

  const setStep = useCallback(
    (step: FormStep) => {
      setCurrentStep(step);
      setStatusMessage(null);
      setPagesSelectionError(null);
      focusStep(step);
    },
    [focusStep],
  );

  const goToNextStep = () => {
    if (!validateStep(currentStep)) {
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
      applyOfferSelection(nextOfferKey);
      applyProjectGoalSeed(nextProjectGoal);
      setCurrentStep(1);
      setStatusMessage(null);
      setStartedAt(new Date().toISOString());
      focusStep(1);
    };

    document.addEventListener("click", handleDocumentClick);

    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [applyOfferSelection, applyProjectGoalSeed, focusStep, getValidOfferKey]);

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

  const getFieldLabel = useCallback(
    (fieldName: string) => {
      const labels: Record<string, string> = {
        consentAccepted: formCopy.consentLabel,
        email: formCopy.emailLabel,
        fullName: formCopy.firstNameLabel,
        goalKey: formCopy.goalLabel,
        offerKey: formCopy.offerLabel,
        pageKeys: formCopy.pagesLabel,
        projectDetails: formCopy.projectDetailsLabel,
        website: formCopy.websiteLabel,
        workflowKey: formCopy.workflowLabel,
      };

      return labels[fieldName] ?? fieldName;
    },
    [
      formCopy.consentLabel,
      formCopy.emailLabel,
      formCopy.firstNameLabel,
      formCopy.goalLabel,
      formCopy.offerLabel,
      formCopy.pagesLabel,
      formCopy.projectDetailsLabel,
      formCopy.websiteLabel,
      formCopy.workflowLabel,
    ],
  );

  const getFieldErrorText = useCallback(
    (fieldName: string, messages: string[]) => {
      const message = messages[0];
      const mappedMessages: Record<string, string> = {
        consent_required: formCopy.fieldErrorConsentRequired,
        full_name_required: formCopy.fieldErrorRequired,
        goal_required: formCopy.fieldErrorGoalRequired,
        invalid_email: formCopy.fieldErrorInvalidEmail,
        invalid_website: formCopy.fieldErrorInvalidWebsite,
        pages_required: formCopy.fieldErrorPagesRequired,
        project_details_required: formCopy.fieldErrorProjectDetailsRequired,
        workflow_required: formCopy.fieldErrorWorkflowRequired,
      };

      if (fieldName === "website" && message === "website_required") {
        return formCopy.fieldErrorRequired;
      }

      return mappedMessages[message] ?? formCopy.fieldErrorRequired;
    },
    [
      formCopy.fieldErrorConsentRequired,
      formCopy.fieldErrorGoalRequired,
      formCopy.fieldErrorInvalidEmail,
      formCopy.fieldErrorInvalidWebsite,
      formCopy.fieldErrorPagesRequired,
      formCopy.fieldErrorProjectDetailsRequired,
      formCopy.fieldErrorRequired,
      formCopy.fieldErrorWorkflowRequired,
    ],
  );

  const getFieldStep = (fieldName: string): FormStep => {
    if (["fullName", "email", "offerKey"].includes(fieldName)) {
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;

    for (const step of STEP_SEQUENCE) {
      if (!validateStep(step)) {
        setStep(step);
        return;
      }
    }

    if (!form.checkValidity() || isSubmitting) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const getValue = (name: string) => String(formData.get(name) ?? "").trim();

    setIsSubmitting(true);
    setFieldErrors({});
    setStatusMessage(formCopy.submittingLabel);

    try {
      const response = await fetch(submitPath, {
        body: JSON.stringify({
          budgetKey: getValue("budgetKey") || undefined,
          company: getValue("company") || undefined,
          consentAccepted: formData.get("consent") === "on",
          email: getValue("email"),
          fullName: getValue("fullName"),
          goalKey: getValue("goalKey") || undefined,
          locale,
          offerKey: selectedOfferKey || getValue("offerKey"),
          pagesCustom: getValue("pagesCustom") || undefined,
          pageKeys: selectedPageKeys,
          phone: getValue("phone") || undefined,
          preferredStartKey: getValue("startKey") || undefined,
          projectDetails: getValue("projectDetails"),
          role: getValue("role") || undefined,
          startedAt,
          website: getValue("website") || undefined,
          websiteTrap: getValue("websiteTrap") || undefined,
          workflowKey: getValue("workflowKey") || undefined,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const payload = (await response.json()) as ContactSubmitResponse;
      if (!response.ok || !payload.ok) {
        if (!payload.ok && payload.fieldErrors) {
          setFieldErrors(payload.fieldErrors);

          if (payload.fieldErrors.pageKeys) {
            setPagesSelectionError(
              getFieldErrorText("pageKeys", payload.fieldErrors.pageKeys),
            );
          }

          const firstInvalidField = Object.keys(payload.fieldErrors)[0];
          if (firstInvalidField) {
            const invalidStep = getFieldStep(firstInvalidField);
            setCurrentStep(invalidStep);
            focusStep(invalidStep);
            setStatusMessage(
              `${formCopy.validationSummaryPrefix}: ${getFieldLabel(firstInvalidField)}. ${getFieldErrorText(
                firstInvalidField,
                payload.fieldErrors[firstInvalidField] ?? [],
              )}`,
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
      form.reset();
      setSelectedOfferKey("");
      setSelectedPageKeys([]);
      setFieldErrors({});
      setCurrentStep(1);
      setStartedAt(new Date().toISOString());
      window.requestAnimationFrame(() => {
        nameInputRef.current?.focus();
      });
    } catch {
      setStatusMessage(formCopy.submitErrorGeneric);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="project-request">
      <div
        className="project-request-panel"
        role="region"
        aria-label={formCopy.title}
      >
        <div className="project-request-head project-request-head--close-only">
          <div className="project-request-head-copy">
            <h3>{formCopy.title}</h3>
            <p className="project-request-intro">{formCopy.intro}</p>
          </div>
        </div>

        <ol
          aria-label={formCopy.stepNavigationLabel}
          className="project-request-stepper"
        >
          {stepTitles.map((title, index) => {
            const step = STEP_SEQUENCE[index];
            const isDone = step < currentStep;
            const isCurrent = step === currentStep;

            return (
              <li
                className={`project-request-stepper-item${isDone ? " is-done" : ""}${isCurrent ? " is-current" : ""}`}
                key={`${title}-${step}`}
              >
                <button
                  aria-current={isCurrent ? "step" : undefined}
                  className="project-request-stepper-trigger"
                  disabled={step > currentStep || isSubmitting}
                  onClick={() => {
                    if (step < currentStep) {
                      setStep(step);
                    }
                  }}
                  type="button"
                >
                  <span className="project-request-stepper-index">{step}</span>
                  <span className="project-request-stepper-copy">
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
          className="project-request-form"
          ref={formRef}
          onSubmit={handleSubmit}
          noValidate
        >
          <input
            aria-hidden="true"
            autoComplete="off"
            className="sr-only"
            name="websiteTrap"
            tabIndex={-1}
            type="text"
          />

          <fieldset
            className="project-request-step"
            data-step="1"
            hidden={currentStep !== 1}
          >
            <legend>{formCopy.stepOneTitle}</legend>

            <div className="project-request-grid project-request-grid--two">
              <label className="project-request-field">
                <span>
                  {formCopy.firstNameLabel}
                  <strong className="project-request-required-marker">*</strong>
                </span>
                <input
                  aria-describedby={
                    fieldErrors.fullName
                      ? "project-request-fullName-error"
                      : undefined
                  }
                  aria-invalid={fieldErrors.fullName ? "true" : undefined}
                  autoCapitalize="words"
                  autoComplete="name"
                  name="fullName"
                  onChange={() => clearFieldError("fullName")}
                  ref={nameInputRef}
                  required
                  type="text"
                />
                {fieldErrors.fullName ? (
                  <small id="project-request-fullName-error" role="alert">
                    {getFieldErrorText("fullName", fieldErrors.fullName)}
                  </small>
                ) : null}
              </label>
              <label className="project-request-field">
                <span>
                  {formCopy.emailLabel}
                  <strong className="project-request-required-marker">*</strong>
                </span>
                <input
                  aria-describedby={
                    fieldErrors.email
                      ? "project-request-email-error"
                      : undefined
                  }
                  aria-invalid={fieldErrors.email ? "true" : undefined}
                  autoComplete="email"
                  name="email"
                  onChange={() => clearFieldError("email")}
                  required
                  type="email"
                />
                {fieldErrors.email ? (
                  <small id="project-request-email-error" role="alert">
                    {getFieldErrorText("email", fieldErrors.email)}
                  </small>
                ) : null}
              </label>
            </div>

            <label className="project-request-field">
              <span>
                {formCopy.offerLabel}
                <strong className="project-request-required-marker">*</strong>
              </span>
              <select
                aria-describedby={
                  fieldErrors.offerKey
                    ? "project-request-offerKey-error"
                    : undefined
                }
                aria-invalid={fieldErrors.offerKey ? "true" : undefined}
                name="offerKey"
                onChange={(event) => {
                  applyOfferSelection(event.target.value);
                  clearFieldError("offerKey");
                }}
                ref={offerSelectRef}
                required
                value={selectedOfferKey}
              >
                <option disabled value="">
                  {formCopy.offerPlaceholder}
                </option>
                {offerOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.title}
                  </option>
                ))}
              </select>
              {fieldErrors.offerKey ? (
                <small id="project-request-offerKey-error" role="alert">
                  {getFieldErrorText("offerKey", fieldErrors.offerKey)}
                </small>
              ) : null}
            </label>

            {selectedOfferKey ? (
              <p className="project-request-conditional-hint">
                {formCopy.conditionalFieldHint}
              </p>
            ) : null}

            <div className="project-request-step-actions project-request-step-actions--end">
              <button
                className="btn btn--primary contact-primary-cta--shimmer"
                disabled={isSubmitting}
                onClick={goToNextStep}
                type="button"
              >
                {stepOneNextLabel}
              </button>
            </div>
          </fieldset>

          <fieldset
            className="project-request-step"
            data-step="2"
            hidden={currentStep !== 2}
          >
            <legend>{formCopy.stepTwoTitle}</legend>

            {fieldRules.requiresWebsite ? (
              <label className="project-request-field">
                <span>
                  {formCopy.websiteLabel}
                  <strong className="project-request-required-marker">*</strong>
                </span>
                <input
                  aria-describedby={
                    fieldErrors.website
                      ? "project-request-website-error"
                      : undefined
                  }
                  aria-invalid={fieldErrors.website ? "true" : undefined}
                  autoComplete="url"
                  name="website"
                  onChange={() => clearFieldError("website")}
                  ref={websiteInputRef}
                  required
                  type="url"
                />
                <small className="project-request-field-hint">
                  {formCopy.websiteRequiredHint}
                </small>
                {fieldErrors.website ? (
                  <small id="project-request-website-error" role="alert">
                    {getFieldErrorText("website", fieldErrors.website)}
                  </small>
                ) : null}
              </label>
            ) : null}

            {fieldRules.requiresGoal ? (
              <label className="project-request-field">
                <span>
                  {formCopy.goalLabel}
                  <strong className="project-request-required-marker">*</strong>
                </span>
                <select
                  aria-describedby={
                    fieldErrors.goalKey
                      ? "project-request-goalKey-error"
                      : undefined
                  }
                  aria-invalid={fieldErrors.goalKey ? "true" : undefined}
                  defaultValue=""
                  name="goalKey"
                  onChange={() => clearFieldError("goalKey")}
                  ref={goalSelectRef}
                  required
                >
                  <option disabled value="">
                    -
                  </option>
                  {formCopy.goalOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.goalKey ? (
                  <small id="project-request-goalKey-error" role="alert">
                    {getFieldErrorText("goalKey", fieldErrors.goalKey)}
                  </small>
                ) : null}
              </label>
            ) : null}

            {fieldRules.requiresPages ? (
              <div
                className="project-request-pages"
                ref={pagesOptionsContainerRef}
                tabIndex={-1}
              >
                <p className="project-request-pages-label">
                  {formCopy.pagesLabel}
                  <strong className="project-request-required-marker">*</strong>
                </p>
                <div className="project-request-pages-options">
                  {formCopy.pagesOptions?.map((option) => {
                    const isSelected = selectedPageKeys.includes(option.key);

                    return (
                      <button
                        aria-pressed={isSelected}
                        className={`project-request-page-option${isSelected ? " is-selected" : ""}`}
                        key={option.key}
                        onClick={() => togglePageOption(option.key)}
                        type="button"
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                <label className="project-request-field project-request-pages-custom">
                  <span>
                    {formCopy.pagesCustomLabel ?? "Weitere Seiten (optional)"}
                  </span>
                  <input
                    aria-describedby={
                      fieldErrors.pageKeys
                        ? "project-request-pageKeys-error"
                        : undefined
                    }
                    aria-invalid={fieldErrors.pageKeys ? "true" : undefined}
                    name="pagesCustom"
                    onChange={() => {
                      clearFieldError("pageKeys");
                      setPagesSelectionError(null);
                    }}
                    placeholder={
                      formCopy.pagesCustomPlaceholder ??
                      formCopy.pagesPlaceholder
                    }
                    ref={pagesCustomInputRef}
                    type="text"
                  />
                </label>
                {pagesSelectionError || fieldErrors.pageKeys ? (
                  <p
                    id="project-request-pageKeys-error"
                    className="project-request-pages-error"
                    role="alert"
                  >
                    {pagesSelectionError ??
                      getFieldErrorText("pageKeys", fieldErrors.pageKeys ?? [])}
                  </p>
                ) : null}
              </div>
            ) : null}

            {fieldRules.requiresWorkflow ? (
              <label className="project-request-field">
                <span>
                  {formCopy.workflowLabel}
                  <strong className="project-request-required-marker">*</strong>
                </span>
                <select
                  aria-describedby={
                    fieldErrors.workflowKey
                      ? "project-request-workflowKey-error"
                      : undefined
                  }
                  aria-invalid={fieldErrors.workflowKey ? "true" : undefined}
                  defaultValue=""
                  name="workflowKey"
                  onChange={() => clearFieldError("workflowKey")}
                  ref={workflowSelectRef}
                  required
                >
                  <option disabled value="">
                    -
                  </option>
                  {formCopy.workflowOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.workflowKey ? (
                  <small id="project-request-workflowKey-error" role="alert">
                    {getFieldErrorText("workflowKey", fieldErrors.workflowKey)}
                  </small>
                ) : null}
              </label>
            ) : null}

            <label className="project-request-field">
              <span>
                {formCopy.projectDetailsLabel}
                <strong className="project-request-required-marker">*</strong>
              </span>
              <textarea
                aria-describedby={
                  fieldErrors.projectDetails
                    ? "project-request-projectDetails-error"
                    : undefined
                }
                aria-invalid={fieldErrors.projectDetails ? "true" : undefined}
                name="projectDetails"
                onChange={() => clearFieldError("projectDetails")}
                placeholder={formCopy.projectDetailsPlaceholder}
                ref={projectDetailsRef}
                required
                rows={5}
              />
              {fieldErrors.projectDetails ? (
                <small id="project-request-projectDetails-error" role="alert">
                  {getFieldErrorText(
                    "projectDetails",
                    fieldErrors.projectDetails,
                  )}
                </small>
              ) : null}
            </label>

            <div className="project-request-step-actions">
              <button
                className="btn btn--ghost"
                disabled={isSubmitting}
                onClick={goToPreviousStep}
                type="button"
              >
                {formCopy.previousStepLabel}
              </button>
              <button
                className="btn btn--primary contact-primary-cta--shimmer"
                disabled={isSubmitting}
                onClick={goToNextStep}
                type="button"
              >
                {stepTwoNextLabel}
              </button>
            </div>
          </fieldset>

          <fieldset
            className="project-request-step"
            data-step="3"
            hidden={currentStep !== 3}
          >
            <legend>{formCopy.stepThreeTitle}</legend>

            <div className="project-request-grid project-request-grid--two">
              <label className="project-request-field">
                <span>{formCopy.companyLabel}</span>
                <input
                  autoCapitalize="words"
                  autoComplete="organization"
                  name="company"
                  type="text"
                />
              </label>
              <label className="project-request-field">
                <span>{formCopy.roleLabel}</span>
                <input
                  autoCapitalize="words"
                  autoComplete="organization-title"
                  name="role"
                  type="text"
                />
              </label>
            </div>

            <label className="project-request-field">
              <span>{formCopy.phoneLabel}</span>
              <input autoComplete="tel" name="phone" type="tel" />
            </label>

            <div className="project-request-grid project-request-grid--two">
              <label className="project-request-field">
                <span>{formCopy.budgetLabel}</span>
                <select defaultValue="" name="budgetKey">
                  <option value="">-</option>
                  {formCopy.budgetOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="project-request-field">
                <span>{formCopy.startLabel}</span>
                <select defaultValue="" name="startKey">
                  <option value="">-</option>
                  {formCopy.startOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="project-request-consent">
              <input
                aria-describedby={
                  fieldErrors.consentAccepted
                    ? "project-request-consent-error"
                    : undefined
                }
                aria-invalid={fieldErrors.consentAccepted ? "true" : undefined}
                name="consent"
                onChange={() => clearFieldError("consentAccepted")}
                ref={consentInputRef}
                required
                type="checkbox"
              />
              <span>
                {formCopy.consentLabel}{" "}
                <a href={privacyHref} target="_self">
                  {privacyLabel}
                </a>
                <strong className="project-request-required-marker">*</strong>
              </span>
            </label>
            {fieldErrors.consentAccepted ? (
              <p id="project-request-consent-error" role="alert">
                {getFieldErrorText(
                  "consentAccepted",
                  fieldErrors.consentAccepted,
                )}
              </p>
            ) : null}

            <div className="project-request-actions">
              <button
                className="btn btn--ghost"
                disabled={isSubmitting}
                onClick={goToPreviousStep}
                type="button"
              >
                {formCopy.previousStepLabel}
              </button>
              <button
                className="btn btn--primary contact-primary-cta--shimmer"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? formCopy.submittingLabel : formCopy.submitLabel}
              </button>
              <p className="project-request-required-hint">
                {formCopy.requiredHint}
              </p>
            </div>
          </fieldset>

          {statusMessage ? (
            <p className="project-request-status" role="status">
              {statusMessage}
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
