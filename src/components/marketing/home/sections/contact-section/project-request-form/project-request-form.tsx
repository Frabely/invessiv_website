"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ContactConsentText } from "@/components/marketing/home/sections/contact-section/contact-consent-text";
import { ContactFieldLabel } from "@/components/marketing/home/sections/contact-section/contact-field-label";
import { ContactFormActions } from "@/components/marketing/home/sections/contact-section/contact-form-actions";
import { ContactFormShell } from "@/components/marketing/home/sections/contact-section/contact-form-shell";
import { ContactFormStatus } from "@/components/marketing/home/sections/contact-section/contact-form-status";
import { PrimaryCtaButton } from "@/components/shared/button/button";
import buttonStyles from "@/components/shared/button/button.module.css";
import { SECTION_HREFS } from "@/config/site";
import type { ContactSubmitResponse } from "@/features/contact/contact.contract";
import { trackConversionEvent } from "@/lib/analytics/conversion-events";
import { useLanguage } from "@/components/providers/language-provider";
import styles from "./project-request-form.module.css";

const DEFAULT_SUBMIT_PATH = "/api/public/contact";
const CONTACT_PROJECT_LINK_SELECTOR = `a[href='${SECTION_HREFS.contact}'][data-project-offer]`;
const STEP_SEQUENCE = [1, 2, 3] as const;

type FormStep = (typeof STEP_SEQUENCE)[number];
type FormOption = {
  key: string;
  label: string;
};
type FormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

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
  bottomHint?: string;
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
  bottomHint,
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
  const ghostButtonClassName = `${buttonStyles.button} ${buttonStyles.ghost}`;
  const fieldOfferClassName = `${styles.field} ${styles.fieldOffer} ${styles.fieldOfferLayout}`;
  const pagesCustomFieldClassName = `${styles.field} ${styles.pagesCustom}`;
  const getFormFieldName = (control: Element) =>
    control.getAttribute("name") === "consent"
      ? "consentAccepted"
      : (control.getAttribute("name") ?? "");

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

  const getClientFieldError = useCallback(
    (
      fieldName: string,
      validity: ValidityState,
      value: string,
    ): string[] | undefined => {
      if (fieldName === "consentAccepted" && validity.valueMissing) {
        return ["consent_required"];
      }
      if (fieldName === "fullName" && validity.valueMissing) {
        return ["full_name_required"];
      }
      if (fieldName === "email") {
        if (validity.valueMissing) {
          return ["required"];
        }
        if (validity.typeMismatch) {
          return ["invalid_email"];
        }
      }
      if (fieldName === "website") {
        if (validity.valueMissing) {
          return ["website_required"];
        }
        if (validity.typeMismatch || validity.patternMismatch) {
          return ["invalid_website"];
        }
      }
      if (fieldName === "goalKey" && validity.valueMissing) {
        return ["goal_required"];
      }
      if (fieldName === "workflowKey" && validity.valueMissing) {
        return ["workflow_required"];
      }
      if (fieldName === "projectDetails") {
        if (validity.valueMissing || !value.trim()) {
          return ["project_details_required"];
        }
      }
      if (validity.valueMissing) {
        return ["required"];
      }
      return undefined;
    },
    [],
  );

  const validateControls = useCallback(
    (
      controls: FormControl[],
    ): {
      firstInvalidControl: FormControl | null;
      nextErrors: Record<string, string[]>;
    } => {
      const nextErrors: Record<string, string[]> = {};
      let firstInvalidControl: FormControl | null = null;

      controls.forEach((control) => {
        if (control.disabled || control.classList.contains("sr-only")) {
          return;
        }

        const fieldName = getFormFieldName(control);
        if (!fieldName) {
          return;
        }

        const fieldError = getClientFieldError(
          fieldName,
          control.validity,
          "value" in control ? String(control.value ?? "") : "",
        );

        if (fieldError) {
          nextErrors[fieldName] = fieldError;
          if (!firstInvalidControl) {
            firstInvalidControl = control;
          }
        }
      });

      return { firstInvalidControl, nextErrors };
    },
    [getClientFieldError],
  );

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

      const { firstInvalidControl, nextErrors } = validateControls(controls);
      if (Object.keys(nextErrors).length > 0) {
        setFieldErrors((previous) => ({ ...previous, ...nextErrors }));
        firstInvalidControl?.focus();
        return false;
      }

      return !(step === 2 && !validatePagesSelection());
    },
    [validateControls, validatePagesSelection],
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

    if (isSubmitting) {
      return;
    }

    const controls = Array.from(
      form.querySelectorAll<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >("input, select, textarea"),
    );
    const { firstInvalidControl, nextErrors } = validateControls(controls);
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors((previous) => ({ ...previous, ...nextErrors }));
      firstInvalidControl?.focus();
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

        <form
          className={styles.form}
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
            className={styles.step}
            data-step="1"
            hidden={currentStep !== 1}
          >
            <legend>{formCopy.stepOneTitle}</legend>

            <div className={`${styles.grid} ${styles.gridTwo}`}>
              <label className={styles.field}>
                <ContactFieldLabel label={formCopy.firstNameLabel} required />
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
              <label className={styles.field}>
                <ContactFieldLabel label={formCopy.emailLabel} required />
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

            <label className={fieldOfferClassName}>
              <ContactFieldLabel label={formCopy.offerLabel} required />
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
                data-empty={selectedOfferKey ? "false" : "true"}
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
              <p className={styles.conditionalHint}>
                {formCopy.conditionalFieldHint}
              </p>
            ) : null}

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
              panelHint={bottomHint}
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
              <label className={styles.field}>
                <ContactFieldLabel label={formCopy.websiteLabel} required />
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
                <small className={styles.fieldHint}>
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
              <label className={styles.field}>
                <ContactFieldLabel label={formCopy.goalLabel} required />
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
                className={styles.pages}
                ref={pagesOptionsContainerRef}
                tabIndex={-1}
              >
                <p className={styles.pagesLabel}>
                  <ContactFieldLabel label={formCopy.pagesLabel} required />
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
                <label className={pagesCustomFieldClassName}>
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
                    className={styles.pagesError}
                    role="alert"
                  >
                    {pagesSelectionError ??
                      getFieldErrorText("pageKeys", fieldErrors.pageKeys ?? [])}
                  </p>
                ) : null}
              </div>
            ) : null}

            {fieldRules.requiresWorkflow ? (
              <label className={styles.field}>
                <ContactFieldLabel label={formCopy.workflowLabel} required />
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

            <label className={styles.field}>
              <ContactFieldLabel
                label={formCopy.projectDetailsLabel}
                required
              />
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
              panelHint={bottomHint}
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
              <label className={styles.field}>
                <span>{formCopy.companyLabel}</span>
                <input
                  autoCapitalize="words"
                  autoComplete="organization"
                  name="company"
                  type="text"
                />
              </label>
              <label className={styles.field}>
                <span>{formCopy.roleLabel}</span>
                <input
                  autoCapitalize="words"
                  autoComplete="organization-title"
                  name="role"
                  type="text"
                />
              </label>
            </div>

            <label className={styles.field}>
              <span>{formCopy.phoneLabel}</span>
              <input autoComplete="tel" name="phone" type="tel" />
            </label>

            <div className={`${styles.grid} ${styles.gridTwo}`}>
              <label className={styles.field}>
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
              <label className={styles.field}>
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

            <label className={styles.consent}>
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
              <ContactConsentText
                consentLabel={formCopy.consentLabel}
                errorClassName={styles.consentError}
                errorId="project-request-consent-error"
                errorMessage={
                  fieldErrors.consentAccepted
                    ? getFieldErrorText(
                        "consentAccepted",
                        fieldErrors.consentAccepted,
                      )
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
              panelHint={bottomHint}
              requiredHint={formCopy.requiredHint}
            />
          </fieldset>
        </form>
      </div>
    </ContactFormShell>
  );
}
