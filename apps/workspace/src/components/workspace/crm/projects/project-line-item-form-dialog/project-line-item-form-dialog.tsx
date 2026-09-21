"use client";

import { type SubmitEvent, useId, useRef, useState } from "react";
import Link from "next/link";

import { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import type { ProjectLineItemErrorCode } from "@invessiv/common/constants/crm/errors/project-line-item-error-codes";
import { ProjectLineItemFieldLimits } from "@invessiv/common/constants/crm/forms/project-line-item-field-limits";
import {
  SERVICE_PRICING_MODE_VALUES,
  ServicePricingMode,
} from "@invessiv/common/constants/crm/service-pricing-modes";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { DialogSize } from "@invessiv/common/constants/ui/dialog-sizes";
import type { ProjectLineItemDto } from "@invessiv/common/contracts/crm/project-line-item.dto";
import type { LineItemTemplateDto } from "@invessiv/common/contracts/crm/line-item-template.dto";
import {
  ButtonControl,
  ButtonLink,
  CustomSelect,
  Dialog,
  FormField,
  PrimaryCtaButton,
} from "@invessiv/ui";
import { projectLineItemsApiService } from "@/client/crm/project-line-items-api-service";
import type { ProjectLineItemFormValidationCode } from "@/common/constants/crm/forms/project-line-item-form-validation-codes";
import type { LineItemFieldsFormValidationCode } from "@/common/constants/crm/forms/line-item-fields-form-validation-codes";
import { DialogMessageTone } from "@/common/constants/ui/dialog-message-tones";
import type {
  ProjectLineItemFormErrors,
  ProjectLineItemFormValues,
} from "@/common/contracts/crm/project-line-item-form-values";
import {
  applyLineItemTemplateToFormValues,
  createProjectLineItemFormValues,
  toCreateProjectLineItemRequest,
  toUpdateProjectLineItemRequest,
  validateProjectLineItemForm,
} from "@/common/patterns/crm/project-line-item-form";
import { resolveRecurringIntervalFor } from "@/common/patterns/crm/line-item-fields-form";
import type { Locale } from "@/config/i18n";
import { useVersionedMutation } from "@/hooks/workspace/use-versioned-mutation";
import type { CrmProjectLineItemsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatMessage } from "@/lib/i18n/format-message";
import { formatEuroCents } from "@/lib/workspace/crm/format-service-price";
import styles from "./project-line-item-form-dialog.module.css";

type ProjectLineItemFormDialogProps = {
  /** Null when the actor may not open the catalog; the no-template hint then has no link. */
  catalogHref: string | null;
  content: CrmProjectLineItemsDictionary;
  locale: Locale;
  onCloseAction: () => void;
  projectId: string;
  /** Null assigns a new service; an existing one edits its snapshot. */
  projectLineItem: ProjectLineItemDto | null;
  templates: readonly LineItemTemplateDto[];
};

function fieldError(
  code:
    | ProjectLineItemFormValidationCode
    | LineItemFieldsFormValidationCode
    | undefined,
  content: CrmProjectLineItemsDictionary,
): string | undefined {
  return code ? content.form.validation[code] : undefined;
}

export function ProjectLineItemFormDialog({
  catalogHref,
  content,
  locale,
  onCloseAction,
  projectId,
  projectLineItem,
  templates,
}: ProjectLineItemFormDialogProps) {
  const formId = useId();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<ProjectLineItemFormValues>(() =>
    createProjectLineItemFormValues(projectLineItem, locale),
  );
  const [errors, setErrors] = useState<ProjectLineItemFormErrors>({});
  const mutation = useVersionedMutation<
    ProjectLineItemDto | null,
    ProjectLineItemErrorCode
  >(projectLineItem, onCloseAction);

  const originTemplate = templates.find(
    (template) => template.id === values.sourceLineItemTemplateId,
  );
  // The prompt is an option rather than a placeholder attribute, and it drops out of the list as
  // soon as a template is picked — there is no way back to "nothing chosen".
  const templateOptions = [
    ...(values.sourceLineItemTemplateId
      ? []
      : [
          {
            label: content.form.placeholders.sourceLineItemTemplateId,
            value: "",
          },
        ]),
    ...templates.map((template) => ({
      label: `${template.title} · ${formatEuroCents(template.priceCents, locale)}`,
      value: template.id,
    })),
  ];

  function update<K extends keyof ProjectLineItemFormValues>(
    key: K,
    value: ProjectLineItemFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function selectTemplate(templateId: string) {
    const template = templates.find((candidate) => candidate.id === templateId);
    if (template) {
      setValues(applyLineItemTemplateToFormValues(template, locale));
    }
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

    const validation = validateProjectLineItemForm(values, {
      requiresTemplate: projectLineItem === null,
    });
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      requestAnimationFrame(() => titleInputRef.current?.focus());
      return;
    }

    await mutation.submit((current) =>
      current
        ? projectLineItemsApiService.updateProjectLineItem(
            current.id,
            toUpdateProjectLineItemRequest(values, current.version),
          )
        : projectLineItemsApiService.createProjectLineItem(
            projectId,
            toCreateProjectLineItemRequest(values),
          ),
    );
  }

  const canAssign = projectLineItem !== null || templates.length > 0;

  return (
    <Dialog
      busy={mutation.isSubmitting}
      closeLabel={content.form.buttons.close}
      description={
        projectLineItem
          ? formatMessage(content.form.description.edit, {
              name: projectLineItem.title,
            })
          : content.form.description.create
      }
      footer={
        canAssign ? (
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
                  : projectLineItem
                    ? content.form.buttons.submitEdit
                    : content.form.buttons.submitCreate}
              </PrimaryCtaButton>
            </div>
          </>
        ) : (
          <div className={styles.footerActions}>
            <ButtonControl
              onClick={mutation.close}
              type="button"
              variant="ghost"
            >
              {content.form.buttons.close}
            </ButtonControl>
            {catalogHref ? (
              <ButtonLink href={catalogHref} linkComponent={Link}>
                {content.form.noTemplates.action}
              </ButtonLink>
            ) : null}
          </div>
        )
      }
      initialFocusRef={titleInputRef}
      onCloseAction={mutation.close}
      size={DialogSize.Narrow}
      title={
        projectLineItem ? content.form.title.edit : content.form.title.create
      }
    >
      {canAssign ? (
        <form
          className={styles.form}
          id={formId}
          noValidate
          onSubmit={handleSubmit}
        >
          <div className={styles.grid}>
            {projectLineItem ? (
              <p className={styles.origin}>
                {originTemplate
                  ? formatMessage(content.form.origin, {
                      name: originTemplate.title,
                    })
                  : content.form.originRemoved}
              </p>
            ) : (
              <FormField
                className={styles.fullWidth}
                errorMessage={fieldError(
                  errors.sourceLineItemTemplateId,
                  content,
                )}
                kind={FormFieldKind.Custom}
                label={content.form.fields.sourceLineItemTemplateId}
                renderControl={({ describedBy, id, invalid }) => (
                  <CustomSelect
                    describedBy={describedBy}
                    id={id}
                    invalid={invalid}
                    onChange={selectTemplate}
                    options={templateOptions}
                    value={values.sourceLineItemTemplateId ?? ""}
                  />
                )}
                required
              />
            )}
            <FormField
              className={styles.fullWidth}
              errorMessage={fieldError(errors.title, content)}
              inputRef={titleInputRef}
              inputProps={{
                maxLength: ProjectLineItemFieldLimits.TitleMaxLength,
                name: "project-line-item-title",
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
                maxLength: ProjectLineItemFieldLimits.DescriptionMaxLength,
                name: "project-line-item-description",
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
                name: "project-line-item-price",
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
                  options={SERVICE_PRICING_MODE_VALUES.map((mode) => ({
                    label: content.list.pricingMode[mode],
                    value: mode,
                  }))}
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
                        label: content.form.interval.monthly,
                        value: BillingInterval.Monthly,
                      },
                      {
                        label: content.form.interval.yearly,
                        value: BillingInterval.Yearly,
                      },
                    ]}
                    // Non-null by construction: the pricing-mode switch above sets a default the
                    // moment this select becomes visible, so one place decides it.
                    value={values.recurringInterval as BillingInterval}
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
      ) : (
        <div className={styles.noTemplates}>
          <p className={styles.noTemplatesTitle}>
            {content.form.noTemplates.title}
          </p>
          <p className={styles.noTemplatesText}>
            {content.form.noTemplates.description}
          </p>
        </div>
      )}
    </Dialog>
  );
}
