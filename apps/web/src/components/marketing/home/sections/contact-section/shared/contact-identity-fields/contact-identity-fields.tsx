import type { FieldErrors, Path, UseFormRegister } from "react-hook-form";
import type { ContactIdentityFieldsCopy } from "@invessiv/common/contracts/contact/copy/contact-identity-fields-copy";
import { CONTACT_FIELD_NAME } from "@invessiv/common/constants/contact/contact-field-names";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { CONTACT_FIELD_ERROR_CODE } from "@invessiv/common/constants/contact/contact-field-error-codes";
import { CONTACT_EMAIL_PATTERN } from "@invessiv/common/patterns/contact/contact-email";
import sharedStyles from "@/components/marketing/home/sections/contact-section/shared/contact-form-primitives.module.css";
import { FormField } from "@/components/shared/form/form-field/form-field";

export type ContactIdentityFieldsValues = {
  displayName: string;
  email: string;
};

type ContactIdentityFieldsProps<TValues extends ContactIdentityFieldsValues> = {
  copy: ContactIdentityFieldsCopy;
  errors: FieldErrors<TValues>;
  getErrorMessage: (fieldName: keyof ContactIdentityFieldsValues) => string;
  register: UseFormRegister<TValues>;
  onFieldChange?: Partial<
    Record<keyof ContactIdentityFieldsValues, () => void>
  >;
};

export function ContactIdentityFields<
  TValues extends ContactIdentityFieldsValues,
>({
  copy,
  errors,
  getErrorMessage,
  register,
  onFieldChange,
}: ContactIdentityFieldsProps<TValues>) {
  const displayNameField = CONTACT_FIELD_NAME.DisplayName as Path<TValues>;
  const emailField = CONTACT_FIELD_NAME.Email as Path<TValues>;

  return (
    <div className={`${sharedStyles.grid} ${sharedStyles.gridTwo}`}>
      <FormField
        errorMessage={
          errors.displayName ? getErrorMessage("displayName") : undefined
        }
        inputProps={{
          ...register(displayNameField, {
            onChange: onFieldChange?.displayName,
            required: CONTACT_FIELD_ERROR_CODE.Required,
          }),
          "aria-invalid": errors.displayName ? "true" : undefined,
          autoCapitalize: "words",
          autoComplete: "name",
        }}
        kind={FormFieldKind.Text}
        label={copy.nameLabel}
        required
      />

      <FormField
        errorMessage={errors.email ? getErrorMessage("email") : undefined}
        inputProps={{
          ...register(emailField, {
            onChange: onFieldChange?.email,
            pattern: {
              message: CONTACT_FIELD_ERROR_CODE.InvalidEmail,
              value: CONTACT_EMAIL_PATTERN,
            },
            required: CONTACT_FIELD_ERROR_CODE.Required,
          }),
          "aria-invalid": errors.email ? "true" : undefined,
          autoComplete: "email",
        }}
        kind={FormFieldKind.Email}
        label={copy.emailLabel}
        required
      />
    </div>
  );
}
