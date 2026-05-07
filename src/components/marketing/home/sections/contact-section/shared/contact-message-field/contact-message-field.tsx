import type { FieldErrors, Path, UseFormRegister } from "react-hook-form";
import type { BaseContactFieldsValues } from "@/common/contracts/contact/fields/base-contact-fields-values";
import type { ContactMessageFieldCopy } from "@/common/contracts/contact/copy/contact-message-field-copy";
import { FormField } from "@/components/shared/form/form-field/form-field";

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
    <FormField
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
