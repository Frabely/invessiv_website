"use client";

import type { ReactNode, RefObject } from "react";
import { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import {
  SERVICE_PRICING_MODE_VALUES,
  ServicePricingMode,
} from "@invessiv/common/constants/crm/service-pricing-modes";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { CustomSelect, FormField } from "@invessiv/ui";
import type { LineItemFieldsContent } from "@/common/contracts/crm/line-item-fields-content";
import type { LineItemFieldsLimits } from "@/common/contracts/crm/line-item-fields-limits";
import type {
  LineItemFieldsFormErrors,
  LineItemFieldsFormValues,
} from "@/common/contracts/crm/line-item-fields-form-values";
import { applyLineItemPricingMode } from "@/common/patterns/crm/line-item-fields-form";
import styles from "./line-item-fields.module.css";

export type LineItemFieldsProps = {
  content: LineItemFieldsContent;
  errors: LineItemFieldsFormErrors;
  namePrefix: string;
  onChangeAction: (patch: Partial<LineItemFieldsFormValues>) => void;
  values: LineItemFieldsFormValues;
};

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

export type LineItemPricingFieldsProps = LineItemFieldsProps & {
  kind: LineItemKind;
  pricingDisabled: boolean;
  pricingHint?: string;
};

export function LineItemPricingFields({
  content,
  errors,
  namePrefix,
  onChangeAction,
  values,
  kind,
  pricingDisabled,
  pricingHint,
}: LineItemPricingFieldsProps) {
  return (
    <>
      <FormField
        errorMessage={
          errors.priceInput ? content.validation[errors.priceInput] : undefined
        }
        inputProps={{
          inputMode: "decimal",
          name: `${namePrefix}-price`,
          onChange: (event) =>
            onChangeAction({ priceInput: event.target.value }),
          value: values.priceInput,
        }}
        inputSuffix={content.currencySymbol}
        kind={FormFieldKind.Text}
        label={
          kind === LineItemKind.Hours
            ? content.fields.hourlyRate
            : content.fields.priceCents
        }
        required
      />
      <FormField
        hint={pricingHint}
        kind={FormFieldKind.Custom}
        label={content.fields.pricingMode}
        renderControl={({ describedBy, id, invalid }) => (
          <CustomSelect
            describedBy={describedBy}
            disabled={pricingDisabled}
            id={id}
            invalid={invalid}
            onChange={(next) =>
              onChangeAction(applyLineItemPricingMode(values, next))
            }
            options={SERVICE_PRICING_MODE_VALUES.map((mode) => ({
              label: content.pricingMode[mode],
              value: mode,
            }))}
            value={values.pricingMode}
          />
        )}
      />
      {values.pricingMode === ServicePricingMode.Recurring ? (
        <FormField
          errorMessage={
            errors.recurringInterval
              ? content.validation[errors.recurringInterval]
              : undefined
          }
          kind={FormFieldKind.Custom}
          label={content.fields.recurringInterval}
          renderControl={({ describedBy, id, invalid }) => (
            <CustomSelect
              describedBy={describedBy}
              id={id}
              invalid={invalid}
              onChange={(next) => onChangeAction({ recurringInterval: next })}
              options={[BillingInterval.Monthly, BillingInterval.Yearly].map(
                (interval) => ({
                  label: content.interval[interval],
                  value: interval,
                }),
              )}
              value={values.recurringInterval ?? BillingInterval.Monthly}
            />
          )}
        />
      ) : null}
    </>
  );
}
