import type { FieldErrors, Path, UseFormRegister } from "react-hook-form";
import { ContactFormField } from "@/components/marketing/home/sections/contact-section/components/contact-form-field";
import {
  CONTACT_EMAIL_PATTERN,
  type ContactIdentityFieldsCopy,
  type ContactIdentityFieldsValues,
} from "@/features/contact/client/base-contact-fields";

type ContactIdentityFieldsProps<TValues extends ContactIdentityFieldsValues> = {
  controlClassName?: string;
  copy: ContactIdentityFieldsCopy;
  errors: FieldErrors<TValues>;
  getErrorMessage: (fieldName: keyof ContactIdentityFieldsValues) => string;
  register: UseFormRegister<TValues>;
  onFieldChange?: Partial<Record<keyof ContactIdentityFieldsValues, () => void>>;
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
  const fullNameField = "fullName" as Path<TValues>;
  const emailField = "email" as Path<TValues>;

  return (
    <>
      <ContactFormField
        controlClassName={controlClassName}
        errorMessage={errors.fullName ? getErrorMessage("fullName") : undefined}
        inputProps={{
          ...register(fullNameField, {
            onChange: onFieldChange?.fullName,
            required: "required",
          }),
          "aria-invalid": errors.fullName ? "true" : undefined,
          autoCapitalize: "words",
          autoComplete: "name",
        }}
        kind="text"
        label={copy.fullNameLabel}
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
