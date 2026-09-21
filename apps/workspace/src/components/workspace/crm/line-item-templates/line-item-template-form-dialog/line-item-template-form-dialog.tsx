"use client";

import { type SubmitEvent, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import { LineItemTemplateFieldLimits } from "@invessiv/common/constants/crm/forms/line-item-template-field-limits";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { LINE_ITEM_TEMPLATE_STATUS_VALUES } from "@invessiv/common/constants/crm/line-item-template-statuses";
import type { LineItemTemplateErrorCode } from "@invessiv/common/constants/crm/errors/line-item-template-error-codes";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import type { LineItemTemplateDto } from "@invessiv/common/contracts/crm/line-item-template.dto";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import { DialogSize } from "@invessiv/common/constants/ui/dialog-sizes";
import {
  ButtonControl,
  CustomSelect,
  Dialog,
  FormField,
  PrimaryCtaButton,
} from "@invessiv/ui";
import { lineItemTemplatesApiService } from "@/client/crm/line-item-templates-api-service";
import { LineItemFieldsFormValidationCode } from "@/common/constants/crm/forms/line-item-fields-form-validation-codes";
import { DialogMessageTone } from "@/common/constants/ui/dialog-message-tones";
import type {
  LineItemTemplateFormErrors,
  LineItemTemplateFormValues,
} from "@/common/contracts/crm/line-item-template-form-values";
import {
  createLineItemTemplateFormValues,
  toCreateLineItemTemplateRequest,
  toUpdateLineItemTemplateRequest,
  validateLineItemTemplateForm,
} from "@/common/patterns/crm/line-item-template-form";
import { resolveRecurringIntervalFor } from "@/common/patterns/crm/line-item-fields-form";
import { useVersionedMutation } from "@/hooks/workspace/use-versioned-mutation";
import type { CrmLineItemTemplatesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatMessage } from "@/lib/i18n/format-message";
import styles from "./line-item-template-form-dialog.module.css";

type LineItemTemplateFormDialogProps = {
  closeHref: string;
  content: CrmLineItemTemplatesDictionary;
  locale: Locale;
  /** Null creates a template; an existing one opens edit mode with the status field shown. */
  lineItemTemplate: LineItemTemplateDto | null;
};

function fieldError(
  code: LineItemFieldsFormValidationCode | undefined,
  content: CrmLineItemTemplatesDictionary,
): string | undefined {
  return code ? content.form.validation[code] : undefined;
}

export function LineItemTemplateFormDialog({
  closeHref,
  content,
  locale,
  lineItemTemplate,
}: LineItemTemplateFormDialogProps) {
  const router = useRouter();
  const formId = useId();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<LineItemTemplateFormValues>(() =>
    createLineItemTemplateFormValues(lineItemTemplate, locale),
  );
  const [errors, setErrors] = useState<LineItemTemplateFormErrors>({});
  const mutation = useVersionedMutation<
    LineItemTemplateDto | null,
    LineItemTemplateErrorCode
  >(lineItemTemplate, () => router.replace(closeHref, { scroll: false }));

  function update<K extends keyof LineItemTemplateFormValues>(
    key: K,
    value: LineItemTemplateFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function selectPricingMode(next: ServicePricingMode) {
    setValues((current) => ({
      ...current,
      pricingMode: next,
      recurringInterval: resolveRecurringIntervalFor(
        next,
        current.recurringInterval,
        BillingInterval.Monthly,
      ),
    }));
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isSubmitting) {
      return;
    }

    const validation = validateLineItemTemplateForm(values);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      requestAnimationFrame(() => titleInputRef.current?.focus());
      return;
    }

    await mutation.submit((current) =>
      current
        ? lineItemTemplatesApiService.updateLineItemTemplate(
            current.id,
            toUpdateLineItemTemplateRequest(values, current.version),
          )
        : lineItemTemplatesApiService.createLineItemTemplate(
            toCreateLineItemTemplateRequest(values),
          ),
    );
  }

  return (
    <Dialog
      busy={mutation.isSubmitting}
      closeLabel={content.form.buttons.close}
      description={
        lineItemTemplate
          ? formatMessage(content.form.description.edit, {
              name: lineItemTemplate.title,
            })
          : undefined
      }
      footer={
        <>
          <p className={styles.footerRequiredHint}>
            {content.form.requiredHint}
          </p>
          <div className={styles.footerActions}>
            <ButtonControl
              disabled={mutation.isSubmitting}
              onClick={mutation.close}
              type="button"
              variant="ghost"
            >
              {content.form.buttons.cancel}
            </ButtonControl>
            <PrimaryCtaButton
              disabled={mutation.isSubmitting}
              form={formId}
              type="submit"
            >
              {mutation.isSubmitting
                ? content.form.buttons.submitting
                : lineItemTemplate
                  ? content.form.buttons.submitEdit
                  : content.form.buttons.submitCreate}
            </PrimaryCtaButton>
          </div>
        </>
      }
      initialFocusRef={titleInputRef}
      onCloseAction={mutation.close}
      size={DialogSize.Narrow}
      title={
        lineItemTemplate ? content.form.title.edit : content.form.title.create
      }
    >
      <form
        className={styles.form}
        id={formId}
        noValidate
        onSubmit={handleSubmit}
      >
        <div className={styles.grid}>
          <FormField
            className={styles.fullWidth}
            errorMessage={fieldError(errors.title, content)}
            inputRef={titleInputRef}
            inputProps={{
              maxLength: LineItemTemplateFieldLimits.TitleMaxLength,
              name: "line-item-template-title",
              onChange: (event) => update("title", event.target.value),
              placeholder: content.form.placeholders.title,
              value: values.title,
            }}
            kind={FormFieldKind.Text}
            label={content.form.fields.title}
            required
          />
          <FormField
            className={styles.fullWidth}
            kind={FormFieldKind.Textarea}
            label={content.form.fields.description}
            textareaProps={{
              maxLength: LineItemTemplateFieldLimits.DescriptionMaxLength,
              name: "line-item-template-description",
              onChange: (event) => update("description", event.target.value),
              placeholder: content.form.placeholders.description,
              rows: 3,
              value: values.description,
            }}
          />
          <FormField
            errorMessage={fieldError(errors.priceInput, content)}
            inputProps={{
              inputMode: "decimal",
              name: "line-item-template-price",
              onChange: (event) => update("priceInput", event.target.value),
              value: values.priceInput,
            }}
            inputSuffix={content.form.currencySymbol}
            kind={FormFieldKind.Text}
            label={content.form.fields.priceCents}
            required
          />
          <FormField
            kind={FormFieldKind.Custom}
            label={content.form.fields.pricingMode}
            renderControl={({ describedBy, id, invalid }) => (
              <CustomSelect
                describedBy={describedBy}
                id={id}
                invalid={invalid}
                onChange={(next) =>
                  selectPricingMode(next as ServicePricingMode)
                }
                options={[
                  {
                    label: content.list.pricingMode.one_time,
                    value: ServicePricingMode.OneTime,
                  },
                  {
                    label: content.list.pricingMode.recurring,
                    value: ServicePricingMode.Recurring,
                  },
                  {
                    label: content.list.pricingMode.rate,
                    value: ServicePricingMode.Rate,
                  },
                ]}
                value={values.pricingMode}
              />
            )}
          />
          {values.pricingMode === ServicePricingMode.Recurring ? (
            <FormField
              errorMessage={fieldError(errors.recurringInterval, content)}
              kind={FormFieldKind.Custom}
              label={content.form.fields.recurringInterval}
              renderControl={({ describedBy, id, invalid }) => (
                <CustomSelect
                  describedBy={describedBy}
                  id={id}
                  invalid={invalid}
                  onChange={(next) =>
                    update("recurringInterval", next as BillingInterval)
                  }
                  options={[
                    {
                      label: content.list.interval.monthly,
                      value: BillingInterval.Monthly,
                    },
                    {
                      label: content.list.interval.yearly,
                      value: BillingInterval.Yearly,
                    },
                  ]}
                  // Non-null by construction: the pricing-mode switch above sets a default the
                  // moment this select becomes visible, so there is exactly one place deciding it.
                  value={values.recurringInterval as BillingInterval}
                />
              )}
            />
          ) : null}
          {lineItemTemplate ? (
            <FormField
              kind={FormFieldKind.Custom}
              label={content.form.fields.status}
              renderControl={({ describedBy, id, invalid }) => (
                <CustomSelect
                  describedBy={describedBy}
                  id={id}
                  invalid={invalid}
                  onChange={(next) =>
                    update(
                      "status",
                      next as LineItemTemplateFormValues["status"],
                    )
                  }
                  options={LINE_ITEM_TEMPLATE_STATUS_VALUES.map((status) => ({
                    label: content.list.status[status],
                    value: status,
                  }))}
                  value={values.status}
                />
              )}
            />
          ) : null}
        </div>

        {mutation.hasConflict && mutation.current ? (
          <section
            className={styles.message}
            data-tone={DialogMessageTone.Conflict}
            role="alert"
          >
            <p className={styles.messageText}>
              {content.form.conflict.message}
            </p>
            <p className={styles.messageDetail}>
              {formatMessage(content.form.conflict.currentTitle, {
                name: mutation.current.title,
              })}
            </p>
          </section>
        ) : null}
        {mutation.errorCode ? (
          <p
            className={styles.message}
            data-tone={DialogMessageTone.Error}
            role="alert"
          >
            {content.form.errors[mutation.errorCode]}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}
