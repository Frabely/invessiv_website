"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

const DEFAULT_SUBMIT_HREF = "mailto:service@invessiv.com";
const STEP_SEQUENCE = [1, 2, 3] as const;

type FormStep = (typeof STEP_SEQUENCE)[number];

type ContactFormCopy = {
  budgetLabel: string;
  budgetOptions: string[];
  conditionalFieldHint: string;
  companyLabel: string;
  consentLabel: string;
  emailLabel: string;
  firstNameLabel: string;
  goalLabel: string;
  goalOptions: string[];
  intro: string;
  lastNameLabel: string;
  mailBodyDetailsLabel: string;
  mailBodyTitle: string;
  mailLabelBudget: string;
  mailLabelCompany: string;
  mailLabelEmail: string;
  mailLabelName: string;
  mailLabelOffer: string;
  mailLabelPhone: string;
  mailLabelRole: string;
  mailLabelStart: string;
  mailLabelWebsite: string;
  mailSubjectPrefix: string;
  offerLabel: string;
  offerPlaceholder: string;
  pagesLabel: string;
  pagesPlaceholder: string;
  pagesOptions?: string[];
  pagesCustomLabel?: string;
  pagesCustomPlaceholder?: string;
  pagesRequiredHint?: string;
  phoneLabel: string;
  projectDetailsLabel: string;
  projectDetailsPlaceholder: string;
  previousStepLabel: string;
  requiredHint: string;
  roleLabel: string;
  stepLabel: string;
  stepNavigationLabel: string;
  stepOneTitle: string;
  stepThreeTitle: string;
  stepTwoTitle: string;
  startLabel: string;
  startOptions: string[];
  submitLabel: string;
  submitSuccess: string;
  subtitle: string;
  title: string;
  websiteRequiredHint: string;
  websiteLabel: string;
  workflowLabel: string;
  workflowOptions: string[];
  nextStepLabel: string;
  nextStepContactLabel?: string;
  nextStepProjectLabel?: string;
};

type ProjectRequestFormProps = {
  formCopy: ContactFormCopy;
  offerOptions: Array<{ key: string; title: string }>;
  privacyHref: string;
  privacyLabel: string;
  submitHref: string;
};

export function ProjectRequestForm({
  formCopy,
  offerOptions,
  privacyHref,
  privacyLabel,
  submitHref,
}: ProjectRequestFormProps) {
  const [selectedOfferKey, setSelectedOfferKey] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<FormStep>(1);
  const [selectedPageOptions, setSelectedPageOptions] = useState<string[]>([]);
  const [pagesSelectionError, setPagesSelectionError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const offerSelectRef = useRef<HTMLSelectElement | null>(null);
  const websiteInputRef = useRef<HTMLInputElement | null>(null);
  const pagesCustomInputRef = useRef<HTMLInputElement | null>(null);
  const workflowSelectRef = useRef<HTMLSelectElement | null>(null);
  const goalSelectRef = useRef<HTMLSelectElement | null>(null);
  const projectDetailsRef = useRef<HTMLTextAreaElement | null>(null);
  const consentInputRef = useRef<HTMLInputElement | null>(null);
  const pagesOptionsContainerRef = useRef<HTMLDivElement | null>(null);

  const selectedOfferTitle =
    offerOptions.find((option) => option.key === selectedOfferKey)?.title ?? "";
  const stepTitles = useMemo(
    () => [formCopy.stepOneTitle, formCopy.stepTwoTitle, formCopy.stepThreeTitle],
    [formCopy.stepOneTitle, formCopy.stepTwoTitle, formCopy.stepThreeTitle],
  );
  const stepOneNextLabel =
    formCopy.nextStepContactLabel ??
    `${formCopy.nextStepLabel} ${formCopy.stepTwoTitle}`;
  const stepTwoNextLabel =
    formCopy.nextStepProjectLabel ??
    `${formCopy.nextStepLabel} ${formCopy.stepThreeTitle}`;
  const availablePageOptions = useMemo(
    () =>
      formCopy.pagesOptions?.length
        ? formCopy.pagesOptions
        : ["Start", "Leistungen", "Über uns", "Kontakt", "Karriere", "Blog", "Landingpage", "Sonstiges"],
    [formCopy.pagesOptions],
  );

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

  const togglePageOption = (option: string) => {
    setSelectedPageOptions((previous) => {
      if (previous.includes(option)) {
        return previous.filter((item) => item !== option);
      }
      return [...previous, option];
    });
    setPagesSelectionError(null);
  };

  const applyOfferSelection = useCallback((nextOfferKey: string) => {
    setSelectedOfferKey(nextOfferKey);

    if (nextOfferKey === "web") {
      return;
    }

    setSelectedPageOptions([]);
    setPagesSelectionError(null);
    if (pagesCustomInputRef.current) {
      pagesCustomInputRef.current.value = "";
    }
  }, []);

  const validatePagesSelection = useCallback(() => {
    if (!fieldRules.requiresPages) {
      setPagesSelectionError(null);
      return true;
    }

    const customPagesValue = pagesCustomInputRef.current?.value.trim() ?? "";
    const hasSelectedPages =
      selectedPageOptions.length > 0 || customPagesValue.length > 0;

    if (hasSelectedPages) {
      setPagesSelectionError(null);
      return true;
    }

    setPagesSelectionError(
      formCopy.pagesRequiredHint ??
        "Bitte mindestens eine Seite auswählen oder ergänzen.",
    );
    pagesOptionsContainerRef.current?.focus();
    return false;
  }, [
    fieldRules.requiresPages,
    formCopy.pagesRequiredHint,
    selectedPageOptions.length,
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
        if (control.disabled) {
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
    const nextStep = Math.min(currentStep + 1, STEP_SEQUENCE.length) as FormStep;
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
      const contactAnchor = target.closest("a[href='#contact'][data-project-offer]");
      if (!(contactAnchor instanceof HTMLAnchorElement)) {
        return;
      }
      const nextOfferKey = getValidOfferKey(contactAnchor.dataset.projectOffer ?? "");
      applyOfferSelection(nextOfferKey);
      setCurrentStep(1);
      setStatusMessage(null);
      focusStep(1);
    };

    document.addEventListener("click", handleDocumentClick);

    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [applyOfferSelection, focusStep, getValidOfferKey]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;

    for (const step of STEP_SEQUENCE) {
      if (!validateStep(step)) {
        setStep(step);
        return;
      }
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const getValue = (name: string) => String(formData.get(name) ?? "").trim();

    const fullName = getValue("fullName");
    const selectedOffer = selectedOfferTitle || getValue("offer");
    const company = getValue("company");
    const website = getValue("website");
    const goal = getValue("goal");
    const pagesSelected = getValue("pagesSelected");
    const pagesCustom = getValue("pagesCustom");
    const pages = [pagesSelected, pagesCustom].filter(Boolean).join(" | ");
    const workflow = getValue("workflow");
    const budget = getValue("budget");
    const start = getValue("start");
    const projectDetails = getValue("projectDetails");
    const subjectLine = [`[${formCopy.mailSubjectPrefix}] ${selectedOffer}`.trim()];
    if (company) {
      subjectLine.push(company);
    }
    const subject = subjectLine.join(" | ");

    const bodyLines = [
      formCopy.mailBodyTitle,
      "",
      `${formCopy.mailLabelOffer}: ${selectedOffer}`,
      "",
    ];
    bodyLines.push(`${formCopy.mailLabelName}: ${fullName}`);
    bodyLines.push(`${formCopy.mailLabelEmail}: ${getValue("email")}`);
    if (company) {
      bodyLines.push(`${formCopy.mailLabelCompany}: ${company}`);
    }

    const optionalFields = [
      [formCopy.mailLabelPhone, getValue("phone")],
      [formCopy.mailLabelRole, getValue("role")],
      [formCopy.mailLabelWebsite, website],
      [formCopy.goalLabel, goal],
      [formCopy.pagesLabel, pages],
      [formCopy.workflowLabel, workflow],
      [formCopy.mailLabelBudget, budget],
      [formCopy.mailLabelStart, start],
    ] as const;

    optionalFields.forEach(([label, value]) => {
      if (value) {
        bodyLines.push(`${label}: ${value}`);
      }
    });

    bodyLines.push("");
    bodyLines.push(`${formCopy.mailBodyDetailsLabel}:`);
    bodyLines.push(projectDetails);

    const normalizedSubmitHref = submitHref.startsWith("mailto:")
      ? submitHref
      : DEFAULT_SUBMIT_HREF;
    const mailToUrl = `${normalizedSubmitHref}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join("\n"))}`;

    window.location.href = mailToUrl;
    setStatusMessage(formCopy.submitSuccess);
  };

  return (
    <div className="project-request">
      <div className="project-request-panel" role="region" aria-label={formCopy.title}>
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
                  disabled={step > currentStep}
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
                    autoCapitalize="words"
                    autoComplete="name"
                    name="fullName"
                    ref={nameInputRef}
                    required
                    type="text"
                  />
                </label>
                <label className="project-request-field">
                  <span>
                    {formCopy.emailLabel}
                    <strong className="project-request-required-marker">*</strong>
                  </span>
                  <input autoComplete="email" name="email" required type="email" />
                </label>
              </div>

              <label className="project-request-field">
                <span>
                  {formCopy.offerLabel}
                  <strong className="project-request-required-marker">*</strong>
                </span>
                <select
                  name="offer"
                  onChange={(event) => {
                    applyOfferSelection(event.target.value);
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
              </label>

              {selectedOfferKey ? (
                <p className="project-request-conditional-hint">
                  {formCopy.conditionalFieldHint}
                </p>
              ) : null}

              <div className="project-request-step-actions project-request-step-actions--end">
                <button
                  className="btn btn--primary contact-primary-cta--shimmer"
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
                    autoComplete="url"
                    name="website"
                    ref={websiteInputRef}
                    required
                    type="url"
                  />
                  <small className="project-request-field-hint">
                    {formCopy.websiteRequiredHint}
                  </small>
                </label>
              ) : null}

              {fieldRules.requiresGoal ? (
                <label className="project-request-field">
                  <span>
                    {formCopy.goalLabel}
                    <strong className="project-request-required-marker">*</strong>
                  </span>
                  <select defaultValue="" name="goal" ref={goalSelectRef} required>
                    <option disabled value="">
                      -
                    </option>
                    {formCopy.goalOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
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
                  <input
                    name="pagesSelected"
                    type="hidden"
                    value={selectedPageOptions.join(", ")}
                  />
                  <div className="project-request-pages-options">
                    {availablePageOptions.map((option) => {
                      const isSelected = selectedPageOptions.includes(option);

                      return (
                        <button
                          aria-pressed={isSelected}
                          className={`project-request-page-option${isSelected ? " is-selected" : ""}`}
                          key={option}
                          onClick={() => togglePageOption(option)}
                          type="button"
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                  <label className="project-request-field project-request-pages-custom">
                    <span>{formCopy.pagesCustomLabel ?? "Weitere Seiten (optional)"}</span>
                    <input
                      name="pagesCustom"
                      placeholder={
                        formCopy.pagesCustomPlaceholder ?? formCopy.pagesPlaceholder
                      }
                      ref={pagesCustomInputRef}
                      type="text"
                    />
                  </label>
                  {pagesSelectionError ? (
                    <p className="project-request-pages-error" role="alert">
                      {pagesSelectionError}
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
                    defaultValue=""
                    name="workflow"
                    ref={workflowSelectRef}
                    required
                  >
                    <option disabled value="">
                      -
                    </option>
                    {formCopy.workflowOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <label className="project-request-field">
                <span>
                  {formCopy.projectDetailsLabel}
                  <strong className="project-request-required-marker">*</strong>
                </span>
                <textarea
                  name="projectDetails"
                  placeholder={formCopy.projectDetailsPlaceholder}
                  ref={projectDetailsRef}
                  required
                  rows={5}
                />
              </label>

              <div className="project-request-step-actions">
                <button
                  className="btn btn--ghost"
                  onClick={goToPreviousStep}
                  type="button"
                >
                  {formCopy.previousStepLabel}
                </button>
                <button
                  className="btn btn--primary contact-primary-cta--shimmer"
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
                  <select defaultValue="" name="budget">
                    <option value="">-</option>
                    {formCopy.budgetOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="project-request-field">
                  <span>{formCopy.startLabel}</span>
                  <select defaultValue="" name="start">
                    <option value="">-</option>
                    {formCopy.startOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="project-request-consent">
                <input name="consent" ref={consentInputRef} required type="checkbox" />
                <span>
                  {formCopy.consentLabel}{" "}
                  <a href={privacyHref} target="_self">
                    {privacyLabel}
                  </a>
                  <strong className="project-request-required-marker">*</strong>
                </span>
              </label>

              <div className="project-request-actions">
                <button
                  className="btn btn--ghost"
                  onClick={goToPreviousStep}
                  type="button"
                >
                  {formCopy.previousStepLabel}
                </button>
                <button
                  className="btn btn--primary contact-primary-cta--shimmer"
                  type="submit"
                >
                  {formCopy.submitLabel}
                </button>
                <p className="project-request-required-hint">{formCopy.requiredHint}</p>
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
