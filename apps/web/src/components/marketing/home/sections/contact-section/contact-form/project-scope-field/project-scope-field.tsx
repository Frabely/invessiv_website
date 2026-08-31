import type { UseFormRegister, UseFormSetValue } from "react-hook-form";
import {
  CONTACT_PROJECT_SCOPES,
  type ContactProjectScope,
} from "@invessiv/common/constants/contact/contact-project-scopes";
import { CONTACT_FORM_FIELD_NAME } from "@invessiv/common/constants/contact/contact-form-field-names";
import type { ContactFormValues } from "@invessiv/common/contracts/contact/forms/contact-form-values";
import { ProjectScopeIcon } from "@/components/marketing/home/sections/contact-section/contact-form/project-scope-field/project-scope-icon/project-scope-icon";
import { FormFieldLabel } from "@/components/shared/form/form-field-label/form-field-label";
import styles from "./project-scope-field.module.css";

type ProjectScopeFieldProps = {
  label: string;
  optionLabels: Record<ContactProjectScope, string>;
  register: UseFormRegister<ContactFormValues>;
  selectedScope?: ContactProjectScope;
  setValue: UseFormSetValue<ContactFormValues>;
};

export function ProjectScopeField({
  label,
  optionLabels,
  register,
  selectedScope,
  setValue,
}: ProjectScopeFieldProps) {
  const scopeField = register(CONTACT_FORM_FIELD_NAME.ProjectScope);

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>
        <FormFieldLabel label={label} />
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
              // Controlled so deselecting also unchecks the native radio;
              // otherwise assistive tech keeps announcing it as selected.
              checked={scope === selectedScope}
              className={styles.input}
              onClick={(event) => {
                if (scope !== selectedScope) {
                  return;
                }

                event.preventDefault();
                setValue(CONTACT_FORM_FIELD_NAME.ProjectScope, undefined, {
                  shouldDirty: true,
                  shouldTouch: true,
                });
              }}
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
    </fieldset>
  );
}
