"use client";

import { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import {
  SERVICE_PRICING_MODE_VALUES,
  ServicePricingMode,
} from "@invessiv/common/constants/crm/service-pricing-modes";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { CustomSelect, FormField } from "@invessiv/ui";
import type { LineItemFieldsProps } from "@/common/contracts/crm/line-item-fields-props";
import { applyLineItemPricingMode } from "@/common/patterns/crm/line-item-fields-form";

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
