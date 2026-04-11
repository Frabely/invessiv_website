import type { FieldErrors, Path, UseFormRegister } from "react-hook-form";
import { ContactFormField } from "@/components/marketing/home/sections/contact-section/components/contact-form-field";
import type { ContactIdentityFieldsCopy } from "@/common/contracts/contact/copy/contact-field-copy";
import type { ContactIdentityFieldsValues } from "@/common/contracts/contact/fields/contact-identity-fields-values";
import { CONTACT_EMAIL_PATTERN } from "@/common/patterns/contact/contact-email";

type ContactIdentityFieldsProps<TValues extends ContactIdentityFieldsValues> = {
  controlClassName?: string;
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
  controlClassName,
  copy,
  errors,
  getErrorMessage,
  register,
  onFieldChange,
}: ContactIdentityFieldsProps<TValues>) {
  const firstNameField = "firstName" as Path<TValues>;
  const lastNameField = "lastName" as Path<TValues>;
  const emailField = "email" as Path<TValues>;

  return (
    <>
      <ContactFormField
        controlClassName={controlClassName}
        errorMessage={
          errors.firstName ? getErrorMessage("firstName") : undefined
        }
        inputProps={{
          ...register(firstNameField, {
            onChange: onFieldChange?.firstName,
            required: "required",
          }),
          "aria-invalid": errors.firstName ? "true" : undefined,
          autoCapitalize: "words",
          autoComplete: "given-name",
        }}
        kind="text"
        label={copy.firstNameLabel}
        required
      />

      <ContactFormField
        controlClassName={controlClassName}
        errorMessage={errors.lastName ? getErrorMessage("lastName") : undefined}
        inputProps={{
          ...register(lastNameField, {
            onChange: onFieldChange?.lastName,
            required: "required",
          }),
          "aria-invalid": errors.lastName ? "true" : undefined,
          autoCapitalize: "words",
          autoComplete: "family-name",
        }}
        kind="text"
        label={copy.lastNameLabel}
        required
      />

      <ContactFormField
        controlClassName={controlClassName}
        errorMessage={errors.email ? getErrorMessage("email") : undefined}
        inputProps={{
          ...register(emailField, {
            onChange: onFieldChange?.email,
            pattern: {
              message: "invalid_email",
              value: CONTACT_EMAIL_PATTERN,
            },
            required: "required",
          }),
          "aria-invalid": errors.email ? "true" : undefined,
          autoComplete: "email",
        }}
        kind="email"
        label={copy.emailLabel}
        required
      />
    </>
  );
}
