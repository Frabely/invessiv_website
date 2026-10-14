"use client";

import type { LineItemFieldsFormValues } from "@/common/contracts/crm/line-item-fields-form-values";

import { type SubmitEvent, useId, useRef, useState } from "react";
import Link from "next/link";

import { ProjectLineItemStatus } from "@invessiv/common/constants/crm/project-line-item-statuses";
import type { ProjectLineItemErrorCode } from "@invessiv/common/constants/crm/errors/project-line-item-error-codes";
import { ProjectLineItemFieldLimits } from "@invessiv/common/constants/crm/forms/project-line-item-field-limits";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { DialogSize } from "@invessiv/common/constants/ui/dialog-sizes";
import type { ProjectLineItemDto } from "@invessiv/common/contracts/crm/project-line-item.dto";
import type { LineItemTemplateDto } from "@invessiv/common/contracts/crm/line-item-template.dto";
import {
  ButtonControl,
  ButtonLink,
  CustomSelect,
  FormDialog,
  FormField,
} from "@invessiv/ui";
import { projectLineItemsApiService } from "@/client/crm/project-line-items-api-service";
import type { LineItemAssignmentBlockers } from "@/common/contracts/crm/line-item-assignment-blockers";
import type {
  ProjectLineItemFormErrors,
  ProjectLineItemFormValues,
} from "@/common/contracts/crm/project-line-item-form-values";
import {
  applyLineItemTemplateToFormValues,
  createProjectLineItemFormValues,
  isAutomatedLineItemKind,
  readProjectLineItemQuantity,
  resolveProjectLineItemFormBlocker,
  toCreateProjectLineItemRequest,
  toUpdateProjectLineItemRequest,
  validateProjectLineItemForm,
} from "@/common/patterns/crm/project-line-item-form";
import { parseEuroAmountToCents } from "@/common/patterns/crm/euro-cents";
import type { Locale } from "@/config/i18n";
import { useVersionedMutation } from "@/hooks/workspace/use-versioned-mutation";
import type { CrmProjectLineItemsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { formatEuroCents } from "@/lib/workspace/crm/format-service-price";
import { ProjectLineItemEffectFields } from "../project-line-item-effect-fields/project-line-item-effect-fields";
import { LineItemIdentityFields } from "@/components/workspace/crm/shared/line-item-identity-fields/line-item-identity-fields";
import { LineItemPricingFields } from "@/components/workspace/crm/shared/line-item-pricing-fields/line-item-pricing-fields";
import { LineItemFormMessages } from "@/components/workspace/crm/shared/line-item-form-messages/line-item-form-messages";
import layout from "@/components/workspace/crm/shared/line-item-form-layout/line-item-form-layout.module.css";
import { LineItemStatusField } from "@/components/workspace/crm/shared/line-item-status-field/line-item-status-field";
import styles from "./project-line-item-form-dialog.module.css";

type ProjectLineItemFormDialogProps = {
  /** What keeps an hours or feedback-round template from being assigned to this project. */
  blockers: LineItemAssignmentBlockers;
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

export function ProjectLineItemFormDialog({
  blockers,
  catalogHref,
  content,
  locale,
  onCloseAction,
  projectId,
  projectLineItem,
  templates,
}: ProjectLineItemFormDialogProps) {
  const formId = useId();
  const [idempotencyKey] = useState(() => crypto.randomUUID());
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
    ...templates.map((template) => {
      // Closed projects still allow hours credited to free stock.
      const reason = resolveProjectLineItemFormBlocker(
        template.kind,
        blockers,
        false,
      );
      return {
        label: `${template.title} · ${formatEuroCents(template.priceCents, locale)}`,
        value: template.id,
        disabled: reason !== null,
        description: reason ? content.form.blockers[reason] : undefined,
      };
    }),
  ];

  function update<K extends keyof ProjectLineItemFormValues>(
    key: K,
    value: ProjectLineItemFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function selectTemplate(templateId: string) {
    const template = templates.find((candidate) => candidate.id === templateId);
    if (
      template &&
      resolveProjectLineItemFormBlocker(template.kind, blockers, false) === null
    ) {
      setValues(applyLineItemTemplateToFormValues(template, locale));
    }
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      mutation.isSubmitting ||
      resolveProjectLineItemFormBlocker(
        values.kind,
        blockers,
        values.allocateHoursToProject,
        projectLineItem !== null,
      )
    ) {
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
            toCreateProjectLineItemRequest(values, idempotencyKey),
          ),
    );
  }

  const canAssign = projectLineItem !== null || templates.length > 0;
  const automated = isAutomatedLineItemKind(values.kind);
  // A blocker only matters for a new assignment; an existing item already took effect.
  const blocker = resolveProjectLineItemFormBlocker(
    values.kind,
    blockers,
    values.allocateHoursToProject,
    projectLineItem !== null,
  );
  const price = parseEuroAmountToCents(values.priceInput);

  const sharedFields = {
    content: {
      ...content.form,
      pricingMode: content.list.pricingMode,
      interval: content.form.interval,
    },
    errors,
    namePrefix: "project-line-item",
    onChangeAction: (patch: Partial<LineItemFieldsFormValues>) =>
      setValues((current) => ({ ...current, ...patch })),
    values,
  };

  return (
    <FormDialog
      busy={mutation.isSubmitting}
      closeLabel={content.form.buttons.close}
      description={
        projectLineItem
          ? formatMessage(content.form.description.edit, {
              name: projectLineItem.title,
            })
          : content.form.description.create
      }
      cancelLabel={content.form.buttons.cancel}
      formId={formId}
      footerHint={content.form.requiredHint}
      submitLabel={
        projectLineItem
          ? content.form.buttons.submitEdit
          : content.form.buttons.submitCreate
      }
      submittingLabel={content.form.buttons.submitting}
      submitDisabled={blocker !== null}
      footer={
        !canAssign ? (
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
        ) : undefined
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
          className={layout.form}
          id={formId}
          noValidate
          onSubmit={handleSubmit}
        >
          <div className={layout.grid}>
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
                className={layout.fullWidth}
                errorMessage={
                  errors.sourceLineItemTemplateId
                    ? content.form.validation[errors.sourceLineItemTemplateId]
                    : undefined
                }
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
            <LineItemIdentityFields
              {...sharedFields}
              limits={ProjectLineItemFieldLimits}
              titleInputRef={titleInputRef}
              afterTitle={
                <>
                  <ProjectLineItemEffectFields
                    allocateHoursToProject={values.allocateHoursToProject}
                    onAllocateChangeAction={(next) =>
                      update("allocateHoursToProject", next)
                    }
                    blocker={blocker}
                    content={content}
                    kind={values.kind}
                    locale={locale}
                    onQuantityChangeAction={(next) =>
                      update("quantityInput", next)
                    }
                    quantityError={errors.quantityInput}
                    quantityInput={values.quantityInput}
                    quantityMinutes={readProjectLineItemQuantity(values)}
                    rateCents={price.ok ? price.cents : null}
                    storedQuantityMinutes={
                      projectLineItem
                        ? projectLineItem.quantityMinutes
                        : undefined
                    }
                  />
                  {automated ? null : (
                    <LineItemStatusField
                      label={content.form.fields.status}
                      labels={content.list.status}
                      value={values.status ?? ProjectLineItemStatus.Planned}
                      onChangeAction={(next) => update("status", next)}
                    />
                  )}
                </>
              }
            />
            <LineItemPricingFields
              {...sharedFields}
              kind={values.kind}
              pricingDisabled={automated}
            />
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
    </FormDialog>
  );
}
