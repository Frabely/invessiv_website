import type { FieldErrors, Path, UseFormRegister } from "react-hook-form";
import type { BaseContactFieldsValues } from "@invessiv/common/contracts/contact/fields/base-contact-fields-values";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import type { ContactMessageFieldCopy } from "@invessiv/common/contracts/contact/copy/contact-message-field-copy";
import { FormField } from "@invessiv/ui";

type ContactMessageFieldProps<TValues extends BaseContactFieldsValues> = {
  copy: ContactMessageFieldCopy;
  errors: FieldErrors<TValues>;
  getErrorMessage: (fieldName: "message") => string;
  register: UseFormRegister<TValues>;
  required?: boolean;
};

export function ContactMessageField<TValues extends BaseContactFieldsValues>({
  copy,
  errors,
  getErrorMessage,
  register,
  required = true,
}: ContactMessageFieldProps<TValues>) {
  const messageField = "message" as Path<TValues>;

  return (
    <FormField
      // Opens one line high so an optional message does not outweigh the required fields.
      autoGrow
      errorMessage={errors.message ? getErrorMessage("message") : undefined}
      kind={FormFieldKind.Textarea}
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
      }}
    />
  );
}
