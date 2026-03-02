"use client";

import { useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

type ContactFormCopy = {
  budgetLabel: string;
  budgetOptions: string[];
  closeLabel: string;
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
  phoneLabel: string;
  projectDetailsLabel: string;
  projectDetailsPlaceholder: string;
  requiredHint: string;
  roleLabel: string;
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
};

type ProjectRequestFormProps = {
  formCopy: ContactFormCopy;
  offerOptions: Array<{ key: string; title: string }>;
  openButtonLabel: string;
  privacyHref: string;
  privacyLabel: string;
  submitHref: string;
};

export function ProjectRequestForm({
  formCopy,
  offerOptions,
  openButtonLabel,
  privacyHref,
  privacyLabel,
  submitHref,
}: ProjectRequestFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOfferKey, setSelectedOfferKey] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const firstNameInputRef = useRef<HTMLInputElement | null>(null);
  const websiteInputRef = useRef<HTMLInputElement | null>(null);
  const pagesInputRef = useRef<HTMLInputElement | null>(null);
  const workflowSelectRef = useRef<HTMLSelectElement | null>(null);
  const goalSelectRef = useRef<HTMLSelectElement | null>(null);

  const selectedOfferTitle =
    offerOptions.find((option) => option.key === selectedOfferKey)?.title ?? "";

  const fieldRules = useMemo(() => {
    const websiteRequiredKeys = ["upgrade", "web", "maintenance"];
    return {
      requiresGoal: selectedOfferKey === "landing",
      requiresPages: selectedOfferKey === "web",
      requiresWebsite: websiteRequiredKeys.includes(selectedOfferKey),
      requiresWorkflow: selectedOfferKey === "process",
    };
  }, [selectedOfferKey]);

  const openForm = () => {
    setIsOpen(true);
    window.requestAnimationFrame(() => {
      firstNameInputRef.current?.focus();
    });
  };

  const closeForm = () => {
    setIsOpen(false);
    setSelectedOfferKey("");
    setStatusMessage(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const getValue = (name: string) => String(formData.get(name) ?? "").trim();

    const fullName = `${getValue("firstName")} ${getValue("lastName")}`.trim();
    const selectedOffer = selectedOfferTitle || getValue("offer");
    const company = getValue("company");
    const subject =
      `[${formCopy.mailSubjectPrefix}] ${selectedOffer} | ${company}`.trim();

    const bodyLines = [
      formCopy.mailBodyTitle,
      "",
      `${formCopy.mailLabelName}: ${fullName}`,
      `${formCopy.mailLabelEmail}: ${getValue("email")}`,
      `${formCopy.mailLabelPhone}: ${getValue("phone") || "-"}`,
      `${formCopy.mailLabelCompany}: ${company}`,
      `${formCopy.mailLabelRole}: ${getValue("role") || "-"}`,
      `${formCopy.mailLabelWebsite}: ${getValue("website") || "-"}`,
      `${formCopy.mailLabelOffer}: ${selectedOffer}`,
      `${formCopy.mailLabelBudget}: ${getValue("budget") || "-"}`,
      `${formCopy.mailLabelStart}: ${getValue("start") || "-"}`,
      `${formCopy.goalLabel}: ${getValue("goal") || "-"}`,
      `${formCopy.pagesLabel}: ${getValue("pages") || "-"}`,
      `${formCopy.workflowLabel}: ${getValue("workflow") || "-"}`,
      "",
      `${formCopy.mailBodyDetailsLabel}:`,
      getValue("projectDetails"),
    ];

    const mailToUrl = `${submitHref}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join("\n"))}`;

    window.location.href = mailToUrl;
    setStatusMessage(formCopy.submitSuccess);
  };

  return (
    <div className="project-request">
      {!isOpen ? (
        <button
          className="btn btn--primary contact-primary-cta contact-primary-cta--shimmer"
          onClick={openForm}
          type="button"
        >
          {openButtonLabel}
        </button>
      ) : null}

      {isOpen ? (
        <div
          className="project-request-panel"
          role="region"
          aria-label={formCopy.title}
        >
          <div className="project-request-head">
            <div>
              <h3>{formCopy.title}</h3>
              <p>{formCopy.subtitle}</p>
            </div>
            <button
              aria-label={formCopy.closeLabel}
              className="project-request-close"
              onClick={closeForm}
              type="button"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>

          <p className="project-request-intro">{formCopy.intro}</p>

          <form
            className="project-request-form"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="project-request-grid project-request-grid--two">
              <label className="project-request-field">
                <span>
                  {formCopy.firstNameLabel}
                  <strong className="project-request-required-marker">*</strong>
                </span>
                <input
                  name="firstName"
                  ref={firstNameInputRef}
                  required
                  type="text"
                />
              </label>
              <label className="project-request-field">
                <span>
                  {formCopy.lastNameLabel}
                  <strong className="project-request-required-marker">*</strong>
                </span>
                <input name="lastName" required type="text" />
              </label>
            </div>

            <div className="project-request-grid project-request-grid--two">
              <label className="project-request-field">
                <span>
                  {formCopy.emailLabel}
                  <strong className="project-request-required-marker">*</strong>
                </span>
                <input name="email" required type="email" />
              </label>
              <label className="project-request-field">
                <span>{formCopy.phoneLabel}</span>
                <input name="phone" type="tel" />
              </label>
            </div>

            <div className="project-request-grid project-request-grid--two">
              <label className="project-request-field">
                <span>
                  {formCopy.companyLabel}
                  <strong className="project-request-required-marker">*</strong>
                </span>
                <input name="company" required type="text" />
              </label>
              <label className="project-request-field">
                <span>{formCopy.roleLabel}</span>
                <input name="role" type="text" />
              </label>
            </div>

            <div className="project-request-grid project-request-grid--three">
              <label className="project-request-field">
                <span>
                  {formCopy.offerLabel}
                  <strong className="project-request-required-marker">*</strong>
                </span>
                <select
                  defaultValue=""
                  name="offer"
                  onChange={(event) => {
                    const nextOfferKey = event.target.value;
                    setSelectedOfferKey(nextOfferKey);
                    window.requestAnimationFrame(() => {
                      if (
                        nextOfferKey === "upgrade" ||
                        nextOfferKey === "web" ||
                        nextOfferKey === "maintenance"
                      ) {
                        websiteInputRef.current?.focus();
                        return;
                      }
                      if (nextOfferKey === "landing") {
                        goalSelectRef.current?.focus();
                        return;
                      }
                      if (nextOfferKey === "process") {
                        workflowSelectRef.current?.focus();
                      }
                    });
                  }}
                  required
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

            <label className="project-request-field">
              <span>
                {formCopy.websiteLabel}
                {fieldRules.requiresWebsite ? (
                  <strong className="project-request-required-marker">*</strong>
                ) : null}
              </span>
              <input
                name="website"
                ref={websiteInputRef}
                required={fieldRules.requiresWebsite}
                type="url"
              />
              {fieldRules.requiresWebsite ? (
                <small className="project-request-field-hint">
                  {formCopy.websiteRequiredHint}
                </small>
              ) : null}
            </label>

            {fieldRules.requiresGoal ? (
              <label className="project-request-field">
                <span>
                  {formCopy.goalLabel}
                  <strong className="project-request-required-marker">*</strong>
                </span>
                <select
                  defaultValue=""
                  name="goal"
                  ref={goalSelectRef}
                  required
                >
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
              <label className="project-request-field">
                <span>
                  {formCopy.pagesLabel}
                  <strong className="project-request-required-marker">*</strong>
                </span>
                <input
                  name="pages"
                  placeholder={formCopy.pagesPlaceholder}
                  ref={pagesInputRef}
                  required
                  type="text"
                />
              </label>
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

            {selectedOfferKey ? (
              <p className="project-request-conditional-hint">
                {formCopy.conditionalFieldHint}
              </p>
            ) : null}

            <label className="project-request-field">
              <span>
                {formCopy.projectDetailsLabel}
                <strong className="project-request-required-marker">*</strong>
              </span>
              <textarea
                name="projectDetails"
                placeholder={formCopy.projectDetailsPlaceholder}
                required
                rows={6}
              />
            </label>

            <label className="project-request-consent">
              <input name="consent" required type="checkbox" />
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
                className="btn btn--primary contact-primary-cta--shimmer"
                type="submit"
              >
                {formCopy.submitLabel}
              </button>
              <p>{formCopy.requiredHint}</p>
            </div>

            {statusMessage ? (
              <p className="project-request-status">{statusMessage}</p>
            ) : null}
          </form>
        </div>
      ) : null}
    </div>
  );
}
