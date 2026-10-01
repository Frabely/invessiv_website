"use client";

import { useState } from "react";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import type { QuestionnaireResolvedField } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-resolved-field";
import type { PortalOnboardingServiceDto } from "@invessiv/common/contracts/portal/portal-onboarding-service.dto";
import { FormField } from "@invessiv/ui";
import type { PortalOnboardingDictionary } from "@/i18n/dictionaries/portal";
import { OnboardingOptionGroup } from "../onboarding-option-group/onboarding-option-group";
import styles from "./onboarding-project-services-field.module.css";

const Choice = {
  Fits: "fits",
  Remark: "remark",
} as const;

type Choice = (typeof Choice)[keyof typeof Choice];

export type OnboardingProjectServicesFieldProps = {
  /** Whether the services are confirmed on the server. */
  confirmed: boolean;
  /** Why the last confirmation was not saved, already worded; null while it is fine. */
  errorMessage: string | null;
  field: QuestionnaireResolvedField;
  /** DOM id of the first option; a jump to this field focuses it. */
  id: string;
  /** The stored remark; null when the services were confirmed as shown or not at all. */
  note: string | null;
  /** `note` null confirms the services as shown. */
  onConfirmAction: (note: string | null) => Promise<boolean>;
  services: readonly PortalOnboardingServiceDto[];
  texts: PortalOnboardingDictionary["field"]["services"];
};

/**
 * What was booked, read-only and without prices, and the customer's word on it: it fits, or a
 * remark. Nothing here changes the services; a remark is cleared up before the work starts.
 */
export function OnboardingProjectServicesField({
  confirmed,
  errorMessage,
  field,
  id,
  note,
  onConfirmAction,
  services,
  texts,
}: OnboardingProjectServicesFieldProps) {
  const [choice, setChoice] = useState<Choice | null>(
    note !== null ? Choice.Remark : confirmed ? Choice.Fits : null,
  );
  const [text, setText] = useState(note ?? "");
  const [noteMissing, setNoteMissing] = useState(false);
  const required = field.requirement === QuestionnaireFieldRequirement.Required;

  function choose(next: Choice) {
    setChoice(next);
    setNoteMissing(false);
    if (next === Choice.Fits) void onConfirmAction(null);
  }

  /** A remark is saved when its field is left, like every other text of the form. */
  function saveNote() {
    const trimmed = text.trim();
    setNoteMissing(trimmed === "");
    if (trimmed !== "" && trimmed !== note) void onConfirmAction(trimmed);
  }

  return (
    <div className={styles.field}>
      <OnboardingOptionGroup
        help={field.help}
        label={field.label}
        required={required}
      >
        <ul aria-label={texts.listLabel} className={styles.services}>
          {services.length === 0 ? (
            <li className={styles.empty}>{texts.empty}</li>
          ) : (
            services.map((service) => (
              <li className={styles.service} key={service.position}>
                <span className={styles.title}>{service.title}</span>
                {service.description ? (
                  <span className={styles.description}>
                    {service.description}
                  </span>
                ) : null}
              </li>
            ))
          )}
        </ul>
        <p className={styles.question}>{texts.question}</p>
        <label>
          <input
            checked={choice === Choice.Fits}
            id={id}
            name={id}
            onChange={() => choose(Choice.Fits)}
            type="radio"
          />
          <span>{texts.fits}</span>
        </label>
        <label>
          <input
            checked={choice === Choice.Remark}
            name={id}
            onChange={() => choose(Choice.Remark)}
            type="radio"
          />
          <span>{texts.remark}</span>
        </label>
      </OnboardingOptionGroup>
      {choice === Choice.Remark ? (
        <FormField
          errorMessage={noteMissing ? texts.noteRequired : undefined}
          hint={texts.noteHint}
          kind={FormFieldKind.Textarea}
          label={texts.noteLabel}
          required
          textareaProps={{
            "aria-required": true,
            maxLength: QUESTIONNAIRE_LIMITS.noteMaxLength,
            onBlur: saveNote,
            onChange: (event) => setText(event.target.value),
            value: text,
          }}
        />
      ) : null}
      {errorMessage ? (
        <p className={styles.error} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
