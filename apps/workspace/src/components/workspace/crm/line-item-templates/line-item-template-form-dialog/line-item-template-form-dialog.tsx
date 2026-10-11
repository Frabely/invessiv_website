"use client";

import type { LineItemFieldsFormValues } from "@/common/contracts/crm/line-item-fields-form-values";

import { type SubmitEvent, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LINE_ITEM_KIND_VALUES,
  LineItemKind,
} from "@invessiv/common/constants/crm/line-item-kinds";
import {
  LINE_ITEM_PROJECT_MODE_VALUES,
  type LineItemProjectMode,
} from "@invessiv/common/constants/crm/line-item-project-modes";
import { LineItemTemplateFieldLimits } from "@invessiv/common/constants/crm/forms/line-item-template-field-limits";
import {
  LINE_ITEM_TEMPLATE_STATUS_VALUES,
  type LineItemTemplateStatus,
} from "@invessiv/common/constants/crm/line-item-template-statuses";
import type { LineItemTemplateErrorCode } from "@invessiv/common/constants/crm/errors/line-item-template-error-codes";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import type { LineItemTemplateDto } from "@invessiv/common/contracts/crm/line-item-template.dto";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import { DialogSize } from "@invessiv/common/constants/ui/dialog-sizes";
import {
  CheckboxControl,
  CustomSelect,
  FormDialog,
  FormField,
} from "@invessiv/ui";
import { lineItemTemplatesApiService } from "@/client/crm/line-item-templates-api-service";
import type {
  LineItemTemplateFormErrors,
  LineItemTemplateFormValues,
} from "@/common/contracts/crm/line-item-template-form-values";
import {
  applyLineItemKindToFormValues,
  createLineItemTemplateFormValues,
  pricingModeOfLineItemKind,
  toCreateLineItemTemplateRequest,
  toUpdateLineItemTemplateRequest,
  validateLineItemTemplateForm,
} from "@/common/patterns/crm/line-item-template-form";
import { useVersionedMutation } from "@/hooks/workspace/use-versioned-mutation";
import type { CrmLineItemTemplatesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import {
  LineItemIdentityFields,
  LineItemPricingFields,
} from "@/components/workspace/crm/shared/line-item-fields/line-item-fields";
import { LineItemFormMessages } from "@/components/workspace/crm/shared/line-item-form-messages/line-item-form-messages";
import layout from "@/components/workspace/crm/shared/line-item-fields/line-item-form-layout.module.css";
import styles from "./line-item-template-form-dialog.module.css";

type LineItemTemplateFormDialogProps = {
  closeHref: string;
  content: CrmLineItemTemplatesDictionary;
  locale: Locale;
  /** Null creates a template; an existing one opens edit mode with the status field shown. */
  lineItemTemplate: LineItemTemplateDto | null;
};

export function LineItemTemplateFormDialog({
  closeHref,
  content,
  locale,
  lineItemTemplate,
}: LineItemTemplateFormDialogProps) {
  const router = useRouter();
  const formId = useId();
  const portalHintId = useId();
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

  const kindFixesPricing = pricingModeOfLineItemKind(values.kind) !== null;
  const kindHint =
    values.kind === LineItemKind.Hours
      ? content.form.hints.kindHours
      : values.kind === LineItemKind.FeedbackRound
        ? content.form.hints.kindFeedbackRound
        : undefined;

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

  const sharedFields = {
    content: {
      ...content.form,
      pricingMode: content.list.pricingMode,
      interval: content.list.interval,
    },
    errors,
    namePrefix: "line-item-template",
    onChangeAction: (patch: Partial<LineItemFieldsFormValues>) =>
      setValues((current) => ({ ...current, ...patch })),
    values,
  };

  return (
    <FormDialog
      busy={mutation.isSubmitting}
      closeLabel={content.form.buttons.close}
      description={
        lineItemTemplate
          ? formatMessage(content.form.description.edit, {
              name: lineItemTemplate.title,
            })
          : undefined
      }
      cancelLabel={content.form.buttons.cancel}
      formId={formId}
      footerHint={content.form.requiredHint}
      submitLabel={
        lineItemTemplate
          ? content.form.buttons.submitEdit
          : content.form.buttons.submitCreate
      }
      submittingLabel={content.form.buttons.submitting}
      initialFocusRef={titleInputRef}
      onCloseAction={mutation.close}
      size={DialogSize.Narrow}
      title={
        lineItemTemplate ? content.form.title.edit : content.form.title.create
      }
    >
      <form
        className={layout.form}
        id={formId}
        noValidate
        onSubmit={handleSubmit}
      >
        <div className={layout.grid}>
          <LineItemIdentityFields
            {...sharedFields}
            limits={LineItemTemplateFieldLimits}
            titleInputRef={titleInputRef}
          />
          <FormField
            className={layout.fullWidth}
            hint={kindHint}
            kind={FormFieldKind.Custom}
            label={content.form.fields.kind}
            renderControl={({ describedBy, id, invalid }) => (
              <CustomSelect
                describedBy={describedBy}
                id={id}
                invalid={invalid}
                onChange={(next) =>
                  setValues((current) =>
                    applyLineItemKindToFormValues(
                      current,
                      next as LineItemKind,
                    ),
                  )
                }
                options={LINE_ITEM_KIND_VALUES.map((kind) => ({
                  label: content.list.kind[kind],
                  value: kind,
                }))}
                value={values.kind}
              />
            )}
          />
          <LineItemPricingFields
            {...sharedFields}
            kind={values.kind}
            pricingDisabled={kindFixesPricing}
            pricingHint={
              kindFixesPricing ? content.form.hints.pricingModeFixed : undefined
            }
          />
          <FormField
            className={layout.fullWidth}
            hint={
              kindFixesPricing ? content.form.hints.projectModeFixed : undefined
            }
            kind={FormFieldKind.Custom}
            label={content.form.fields.projectMode}
            renderControl={({ describedBy, id, invalid }) => (
              <CustomSelect
                describedBy={describedBy}
                disabled={kindFixesPricing}
                id={id}
                invalid={invalid}
                onChange={(next) =>
                  update("projectMode", next as LineItemProjectMode)
                }
                options={LINE_ITEM_PROJECT_MODE_VALUES.map((mode) => ({
                  label: content.form.projectMode[mode],
                  value: mode,
                }))}
                value={values.projectMode}
              />
            )}
          />
          <div className={styles.release}>
            <label className={styles.releaseLabel}>
              <CheckboxControl
                aria-describedby={portalHintId}
                checked={values.portalRequestable}
                name="line-item-template-portal-requestable"
                onChange={(event) =>
                  update("portalRequestable", event.target.checked)
                }
              />
              {content.form.fields.portalRequestable}
            </label>
            <p className={styles.releaseHint} id={portalHintId}>
              {content.form.hints.portal}
            </p>
            <FormField
              errorMessage={
                errors.portalDescription
                  ? content.form.validation[errors.portalDescription]
                  : undefined
              }
              kind={FormFieldKind.Textarea}
              label={content.form.fields.portalDescription}
              required={values.portalRequestable}
              textareaProps={{
                maxLength:
                  LineItemTemplateFieldLimits.PortalDescriptionMaxLength,
                name: "line-item-template-portal-description",
                onChange: (event) =>
                  update("portalDescription", event.target.value),
                placeholder: content.form.placeholders.portalDescription,
                rows: 3,
                value: values.portalDescription,
              }}
            />
          </div>
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
                    update("status", next as LineItemTemplateStatus)
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

        <LineItemFormMessages
          conflictMessage={
            mutation.hasConflict && mutation.current
              ? content.form.conflict.message
              : undefined
          }
          conflictDetail={
            mutation.hasConflict && mutation.current
              ? formatMessage(content.form.conflict.currentTitle, {
                  name: mutation.current.title,
                })
              : undefined
          }
          errorMessage={
            mutation.errorCode
              ? content.form.errors[mutation.errorCode]
              : undefined
          }
        />
      </form>
    </FormDialog>
  );
}
