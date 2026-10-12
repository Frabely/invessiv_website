"use client";
import {
  CustomSelect,
  FormField,
  FormFieldset,
  OptionTile,
} from "@invessiv/ui";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { ServiceRequestFieldLimits } from "@invessiv/common/constants/crm/forms/service-request-field-limits";
import { ServiceRequestProjectWish as Mode } from "@invessiv/common/constants/crm/service-request-project-wishes";
import { OptionTileKind } from "@invessiv/common/constants/ui/option-tile-kinds";
import type { ServiceRequestDto } from "@invessiv/common/contracts/crm/service-requests/service-request.dto";
import type { CrmServiceRequestsDictionary } from "@/i18n/dictionaries/workspace/crm";
import type { ServiceRequestsViewModel } from "@/common/contracts/crm/service-requests-view-model";
import type { ServiceRequestAcceptFormValues } from "@/common/contracts/crm/service-request-accept-form-values";
import {
  canChooseServiceRequestProject,
  canChooseServiceRequestTemplate,
} from "@/common/patterns/crm/service-requests/service-request-accept-form";
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
    onSelectTemplateAction: (id: string) => void;
  };

const PROJECT_MODE_NAME = "service-request-project-mode";
const TEMPLATE_MODE_NAME = "service-request-template-mode";

/** The choice between an existing and a new project only exists where a new one may be created. */
export function ServiceRequestProjectFields({
  request,
  viewModel,
  content,
  values,
  unavailable,
  onChangeAction,
}: ServiceRequestProjectFieldsProps) {
  const canChoose = canChooseServiceRequestProject(request, viewModel);
  return (
    <>
      {canChoose ? (
        <FormFieldset label={content.form.project}>
          <div className={styles.choices}>
            <OptionTile
              kind={OptionTileKind.Radio}
              name={PROJECT_MODE_NAME}
              value={Mode.Existing}
              checked={values.projectMode === Mode.Existing}
              onChange={() => onChangeAction({ projectMode: Mode.Existing })}
            >
              {content.form.existingProject}
            </OptionTile>
            <OptionTile
              kind={OptionTileKind.Radio}
              name={PROJECT_MODE_NAME}
              value={Mode.New}
              checked={values.projectMode === Mode.New}
              onChange={() => onChangeAction({ projectMode: Mode.New })}
            >
              {content.form.newProject}
            </OptionTile>
          </div>
        </FormFieldset>
      ) : null}
      {values.projectMode === Mode.Existing ? (
        <FormField
          kind={FormFieldKind.Custom}
          label={
            canChoose ? content.form.existingProject : content.form.project
          }
          required
          errorMessage={unavailable ? content.form.noProject : undefined}
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
    </>
  );
}

/** A request from the catalog keeps its template; only free text may pick or create one. */
export function ServiceRequestTemplateFields({
  request,
  viewModel,
  content,
  values,
  unavailable,
  onChangeAction,
  onSelectTemplateAction,
}: ServiceRequestTemplateFieldsProps) {
  const templates = viewModel.templates.filter((t) => t.kind === request.kind);
  const source = templates.find((t) => t.id === request.lineItemTemplateId);
  const canChoose = canChooseServiceRequestTemplate(request, viewModel);
  return (
    <>
      {canChoose ? (
        <FormFieldset label={content.form.template}>
          <div className={styles.choices}>
            <OptionTile
              kind={OptionTileKind.Radio}
              name={TEMPLATE_MODE_NAME}
              value={Mode.Existing}
              checked={values.templateMode === Mode.Existing}
              onChange={() => onChangeAction({ templateMode: Mode.Existing })}
            >
              {content.form.existingTemplate}
            </OptionTile>
            <OptionTile
              kind={OptionTileKind.Radio}
              name={TEMPLATE_MODE_NAME}
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
            >
              {content.form.newTemplate}
            </OptionTile>
          </div>
        </FormFieldset>
      ) : null}
      {values.templateMode !== Mode.Existing ? null : source ? (
        <FormField
          kind={FormFieldKind.Text}
          label={content.form.template}
          inputProps={{ value: source.title, readOnly: true }}
        />
      ) : (
        <FormField
          kind={FormFieldKind.Custom}
          label={
            canChoose ? content.form.existingTemplate : content.form.template
          }
          required
          hint={
            request.lineItemTemplateId
              ? content.form.templateUnavailable
              : undefined
          }
          errorMessage={unavailable ? content.form.noTemplate : undefined}
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
      )}
    </>
  );
}
