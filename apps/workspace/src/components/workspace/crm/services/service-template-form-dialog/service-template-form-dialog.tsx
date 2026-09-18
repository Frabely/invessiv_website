"use client";

import { type SubmitEvent, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import { ServiceTemplateFieldLimits } from "@invessiv/common/constants/crm/forms/service-template-field-limits";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { SERVICE_TEMPLATE_STATUS_VALUES } from "@invessiv/common/constants/crm/service-template-statuses";
import type { ServiceTemplateErrorCode } from "@invessiv/common/constants/crm/errors/service-template-error-codes";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import type { ServiceTemplateDto } from "@invessiv/common/contracts/crm/service-template.dto";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import { DialogSize } from "@invessiv/common/constants/ui/dialog-sizes";
import {
  ButtonControl,
  CustomSelect,
  Dialog,
  FormField,
  PrimaryCtaButton,
} from "@invessiv/ui";
import { serviceTemplatesApiService } from "@/client/crm/service-templates-api-service";
import { ServiceTemplateFormValidationCode } from "@/common/constants/crm/forms/service-template-form-validation-codes";
import { DialogMessageTone } from "@/common/constants/ui/dialog-message-tones";
import type {
  ServiceTemplateFormErrors,
  ServiceTemplateFormValues,
} from "@/common/contracts/crm/service-template-form-values";
import {
  createServiceTemplateFormValues,
  toCreateServiceTemplateRequest,
  toUpdateServiceTemplateRequest,
  validateServiceTemplateForm,
} from "@/common/patterns/crm/service-template-form";
import { useVersionedMutation } from "@/hooks/workspace/use-versioned-mutation";
import type { CrmServicesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatMessage } from "@/lib/i18n/format-message";
import styles from "./service-template-form-dialog.module.css";

type ServiceTemplateFormDialogProps = {
  closeHref: string;
  content: CrmServicesDictionary;
  locale: Locale;
  /** Null creates a template; an existing one opens edit mode with the status field shown. */
  serviceTemplate: ServiceTemplateDto | null;
};

function fieldError(
  code: ServiceTemplateFormValidationCode | undefined,
  content: CrmServicesDictionary,
): string | undefined {
  return code ? content.form.validation[code] : undefined;
}

export function ServiceTemplateFormDialog({
  closeHref,
  content,
  locale,
  serviceTemplate,
}: ServiceTemplateFormDialogProps) {
  const router = useRouter();
  const formId = useId();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<ServiceTemplateFormValues>(() =>
    createServiceTemplateFormValues(serviceTemplate, locale),
  );
  const [errors, setErrors] = useState<ServiceTemplateFormErrors>({});
  const mutation = useVersionedMutation<
    ServiceTemplateDto | null,
    ServiceTemplateErrorCode
  >(serviceTemplate, () => router.replace(closeHref, { scroll: false }));

  function update<K extends keyof ServiceTemplateFormValues>(
    key: K,
    value: ServiceTemplateFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isSubmitting) {
      return;
    }

    const validation = validateServiceTemplateForm(values);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      requestAnimationFrame(() => titleInputRef.current?.focus());
      return;
    }

    await mutation.submit((current) =>
      current
        ? serviceTemplatesApiService.updateServiceTemplate(
            current.id,
            toUpdateServiceTemplateRequest(values, current.version),
          )
        : serviceTemplatesApiService.createServiceTemplate(
            toCreateServiceTemplateRequest(values),
          ),
    );
  }

  return (
    <Dialog
      busy={mutation.isSubmitting}
      closeLabel={content.form.buttons.close}
      description={
        serviceTemplate
          ? formatMessage(content.form.description.edit, {
              name: serviceTemplate.title,
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
                : serviceTemplate
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
        serviceTemplate ? content.form.title.edit : content.form.title.create
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
              maxLength: ServiceTemplateFieldLimits.TitleMaxLength,
              name: "service-template-title",
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
              maxLength: ServiceTemplateFieldLimits.DescriptionMaxLength,
              name: "service-template-description",
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
              name: "service-template-price",
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
                onChange={(next) => {
                  update("pricingMode", next as ServicePricingMode);
                  if (next !== ServicePricingMode.Recurring) {
                    update("recurringInterval", null);
                  } else if (!values.recurringInterval) {
                    update("recurringInterval", BillingInterval.Monthly);
                  }
                }}
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
          {serviceTemplate ? (
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
                      next as ServiceTemplateFormValues["status"],
                    )
                  }
                  options={SERVICE_TEMPLATE_STATUS_VALUES.map((status) => ({
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
