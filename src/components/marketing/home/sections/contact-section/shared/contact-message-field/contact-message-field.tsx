import type { FieldErrors, Path, UseFormRegister } from "react-hook-form";
import { ContactFormField } from "@/components/marketing/home/sections/contact-section/shared/contact-form-field/contact-form-field";
import type { BaseContactFieldsValues } from "@/common/contracts/contact/fields/base-contact-fields-values";
import type { ContactMessageFieldCopy } from "@/common/contracts/contact/copy/contact-field-copy";

type ContactMessageFieldProps<TValues extends BaseContactFieldsValues> = {
  className?: string;
  copy: ContactMessageFieldCopy;
  errors: FieldErrors<TValues>;
  getErrorMessage: (fieldName: "message") => string;
  register: UseFormRegister<TValues>;
  required?: boolean;
  rows?: number;
};

export function ContactMessageField<TValues extends BaseContactFieldsValues>({
  className,
  copy,
  errors,
  getErrorMessage,
  register,
  required = true,
  rows = 5,
}: ContactMessageFieldProps<TValues>) {
  const messageField = "message" as Path<TValues>;

  return (
    <ContactFormField
      className={className}
      errorMessage={errors.message ? getErrorMessage("message") : undefined}
      kind="textarea"
      label={copy.messageLabel}
      required={required}
      textareaProps={{
        ...register(messageField, {
          required: required ? "message_required" : false,
          validate: (value) =>
            !required || value.trim().length > 0 || "message_required",
        }),
        "aria-invalid": errors.message ? "true" : undefined,
        placeholder: copy.messagePlaceholder,
        rows,
      }}
    />
  );
}
