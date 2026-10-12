"use client";
import type { ReactNode } from "react";
import { FormField, CustomSelect, RadioControl } from "@invessiv/ui";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { ServiceRequestFieldLimits } from "@invessiv/common/constants/crm/forms/service-request-field-limits";
import { ServiceRequestProjectWish as Mode } from "@invessiv/common/constants/crm/service-request-project-wishes";
import type { ServiceRequestDto } from "@invessiv/common/contracts/crm/service-requests/service-request.dto";
import type { CrmServiceRequestsDictionary } from "@/i18n/dictionaries/workspace/crm";
import type { ServiceRequestsViewModel } from "@/common/contracts/crm/service-requests-view-model";
import type { ServiceRequestAcceptFormValues } from "@/common/contracts/crm/service-request-accept-form-values";
import styles from "./service-request-target-fields.module.css";

export type ServiceRequestProjectFieldsProps = {
  request: ServiceRequestDto;
  viewModel: ServiceRequestsViewModel;
  content: CrmServiceRequestsDictionary;
  values: ServiceRequestAcceptFormValues;
  unavailable: boolean;
  onChangeAction: (patch: Partial<ServiceRequestAcceptFormValues>) => void;
};
export type ServiceRequestTemplateFieldsProps =
  ServiceRequestProjectFieldsProps & {
    children: ReactNode;
    onSelectTemplateAction: (id: string) => void;
  };

export function ServiceRequestProjectFields({
  request,
  viewModel,
  content,
  values,
  unavailable,
  onChangeAction,
}: ServiceRequestProjectFieldsProps) {
  return (
    <fieldset className={styles.group}>
      <legend>{content.form.project}</legend>
      <div className={styles.choices}>
        <label>
          <RadioControl
            name="service-request-project-mode"
            value={Mode.Existing}
            checked={values.projectMode === Mode.Existing}
            onChange={() => onChangeAction({ projectMode: Mode.Existing })}
          />
          {content.form.existingProject}
        </label>
        {viewModel.canCreateProject &&
        request.kind === LineItemKind.Standard ? (
          <label>
            <RadioControl
              name="service-request-project-mode"
              value={Mode.New}
              checked={values.projectMode === Mode.New}
              onChange={() => onChangeAction({ projectMode: Mode.New })}
            />
            {content.form.newProject}
          </label>
        ) : null}
      </div>
      {values.projectMode === Mode.Existing ? (
        <FormField
          kind={FormFieldKind.Custom}
          label={content.form.project}
          required
          renderControl={({ id, describedBy }) => (
            <CustomSelect
              id={id}
              describedBy={describedBy}
              value={values.projectId}
              onChange={(next) => onChangeAction({ projectId: next })}
              options={[
                { value: "", label: content.form.selectProject },
                ...viewModel.projects.map((p) => ({
                  value: p.id,
                  label: p.title,
                })),
              ]}
            />
          )}
        />
      ) : (
        <FormField
          kind={FormFieldKind.Text}
          label={content.form.projectTitle}
          required
          hint={content.form.projectHint}
          inputProps={{
            value: values.projectTitle,
            onChange: (e) => onChangeAction({ projectTitle: e.target.value }),
            maxLength: ServiceRequestFieldLimits.TitleMaxLength,
          }}
        />
      )}
      {unavailable ? <p role="alert">{content.form.noProject}</p> : null}
    </fieldset>
  );
}

export function ServiceRequestTemplateFields({
  request,
  viewModel,
  content,
  values,
  unavailable,
  onChangeAction,
  onSelectTemplateAction,
  children,
}: ServiceRequestTemplateFieldsProps) {
  const templates = viewModel.templates.filter((t) => t.kind === request.kind);
  const source = templates.find((t) => t.id === request.lineItemTemplateId);
  return (
    <fieldset className={styles.group}>
      <legend>{content.form.template}</legend>
      {!request.lineItemTemplateId &&
      viewModel.canCreateTemplate &&
      request.kind === LineItemKind.Standard ? (
        <div className={styles.choices}>
          <label>
            <RadioControl
              name="service-request-template-mode"
              value={Mode.Existing}
              checked={values.templateMode === Mode.Existing}
              onChange={() => onChangeAction({ templateMode: Mode.Existing })}
            />
            {content.form.existingTemplate}
          </label>
          <label>
            <RadioControl
              name="service-request-template-mode"
              value={Mode.New}
              checked={values.templateMode === Mode.New}
              onChange={() =>
                onChangeAction({
                  templateMode: Mode.New,
                  title: request.title,
                  description: request.note,
                  priceInput: "",
                })
              }
            />
            {content.form.newTemplate}
          </label>
        </div>
      ) : null}
      {values.templateMode === Mode.Existing ? (
        source ? (
          <p className={styles.fixedSource}>{source.title}</p>
        ) : (
          <>
            <p className={styles.hint}>
              {request.lineItemTemplateId
                ? content.form.templateUnavailable
                : content.form.existingTemplate}
            </p>
            <FormField
              kind={FormFieldKind.Custom}
              label={content.form.template}
              required
              renderControl={({ id, describedBy }) => (
                <CustomSelect
                  id={id}
                  describedBy={describedBy}
                  value={values.templateId}
                  onChange={onSelectTemplateAction}
                  options={[
                    { value: "", label: content.form.selectTemplate },
                    ...templates.map((t) => ({
                      value: t.id,
                      label: t.title,
                    })),
                  ]}
                />
              )}
            />
          </>
        )
      ) : null}
      {unavailable ? <p role="alert">{content.form.noTemplate}</p> : null}
      {children}
    </fieldset>
  );
}
