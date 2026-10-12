"use client";

import type { ReactNode, RefObject } from "react";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { FormField } from "@invessiv/ui";
import type { LineItemFieldsLimits } from "@/common/contracts/crm/line-item-fields-limits";
import type { LineItemFieldsProps } from "@/common/contracts/crm/line-item-fields-props";
import styles from "./line-item-identity-fields.module.css";

export type LineItemIdentityFieldsProps = LineItemFieldsProps & {
  limits: LineItemFieldsLimits;
  titleInputRef: RefObject<HTMLInputElement | null>;
  afterTitle?: ReactNode;
};

/** Optional project controls stay between title and description without duplicating either field. */
export function LineItemIdentityFields({
  content,
  errors,
  limits,
  namePrefix,
  onChangeAction,
  values,
  titleInputRef,
  afterTitle,
}: LineItemIdentityFieldsProps) {
  return (
    <>
      <FormField
        className={styles.fullWidth}
        errorMessage={
          errors.title ? content.validation[errors.title] : undefined
        }
        inputRef={titleInputRef}
        inputProps={{
          maxLength: limits.TitleMaxLength,
          name: `${namePrefix}-title`,
          onChange: (event) => onChangeAction({ title: event.target.value }),
          placeholder: content.placeholders.title,
          value: values.title,
        }}
        kind={FormFieldKind.Text}
        label={content.fields.title}
        required
      />
      {afterTitle}
      <FormField
        className={styles.fullWidth}
        kind={FormFieldKind.Textarea}
        label={content.fields.description}
        textareaProps={{
          maxLength: limits.DescriptionMaxLength,
          name: `${namePrefix}-description`,
          onChange: (event) =>
            onChangeAction({ description: event.target.value }),
          placeholder: content.placeholders.description,
          rows: 3,
          value: values.description,
        }}
      />
    </>
  );
}
