import type { UseFormRegister } from "react-hook-form";
import {
  CONTACT_PROJECT_SCOPES,
  type ContactProjectScope,
  isContactProjectScope,
} from "@invessiv/common/constants/contact/contact-project-scopes";
import { CONTACT_FIELD_ERROR_CODE } from "@invessiv/common/constants/contact/contact-field-error-codes";
import { CONTACT_FORM_FIELD_NAME } from "@invessiv/common/constants/contact/contact-form-field-names";
import type { ContactFormValues } from "@invessiv/common/contracts/contact/forms/contact-form-values";
import { ProjectScopeIcon } from "@/components/marketing/home/sections/contact-section/contact-form/project-scope-field/project-scope-icon/project-scope-icon";
import { FormFieldLabel } from "@/components/shared/form/form-field-label/form-field-label";
import styles from "./project-scope-field.module.css";

type ProjectScopeFieldProps = {
  errorMessage?: string;
  label: string;
  optionLabels: Record<ContactProjectScope, string>;
  register: UseFormRegister<ContactFormValues>;
  selectedScope: ContactProjectScope;
};

export function ProjectScopeField({
  errorMessage,
  label,
  optionLabels,
  register,
  selectedScope,
}: ProjectScopeFieldProps) {
  const scopeField = register(CONTACT_FORM_FIELD_NAME.ProjectScope, {
    required: CONTACT_FIELD_ERROR_CODE.Required,
    validate: (value) =>
      isContactProjectScope(value) || CONTACT_FIELD_ERROR_CODE.Required,
  });

  return (
    <fieldset
      aria-describedby={CONTACT_FORM_FIELD_NAME.ProjectScope}
      aria-invalid={errorMessage ? "true" : undefined}
      aria-required="true"
      className={styles.fieldset}
    >
      <legend className={styles.legend}>
        <FormFieldLabel label={label} required />
      </legend>

      <div className={styles.chips}>
        {CONTACT_PROJECT_SCOPES.map((scope) => (
          <label
            className={styles.chip}
            data-selected={scope === selectedScope ? "true" : undefined}
            key={scope}
          >
            <input
              {...scopeField}
              className={styles.input}
              type="radio"
              value={scope}
            />
            <span className={styles.iconSlot}>
              <ProjectScopeIcon scope={scope} />
            </span>
            <span className={styles.chipLabel}>{optionLabels[scope]}</span>
          </label>
        ))}
      </div>

      <small
        aria-hidden={errorMessage ? undefined : "true"}
        className={`${styles.error}${errorMessage ? "" : ` ${styles.errorHidden}`}`}
        id={CONTACT_FORM_FIELD_NAME.ProjectScope}
        role={errorMessage ? "alert" : undefined}
      >
        {errorMessage}
      </small>
    </fieldset>
  );
}
