"use client";
import { CustomSelect, FormField } from "@invessiv/ui";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { ServiceRequestProjectWish as Mode } from "@invessiv/common/constants/crm/service-request-project-wishes";
import type { ServiceRequestDto } from "@invessiv/common/contracts/crm/service-requests/service-request.dto";
import type { CrmServiceRequestsDictionary } from "@/i18n/dictionaries/workspace/crm";
import type { ServiceRequestsViewModel } from "@/common/contracts/crm/service-requests-view-model";
import type { ServiceRequestAcceptFormValues } from "@/common/contracts/crm/service-request-accept-form-values";
import { canChooseServiceRequestTemplate } from "@/common/patterns/crm/service-requests/service-request-accept-form";
import { ServiceRequestModeChoice } from "../service-request-mode-choice/service-request-mode-choice";

export type ServiceRequestTemplateFieldsProps = {
  request: ServiceRequestDto;
  viewModel: ServiceRequestsViewModel;
  content: CrmServiceRequestsDictionary;
  values: ServiceRequestAcceptFormValues;
  unavailable: boolean;
  onChangeAction: (patch: Partial<ServiceRequestAcceptFormValues>) => void;
  onSelectTemplateAction: (id: string) => void;
};

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
        <ServiceRequestModeChoice
          label={content.form.template}
          name="service-request-template-mode"
          existingLabel={content.form.existingTemplate}
          newLabel={content.form.newTemplate}
          value={values.templateMode}
          onExistingAction={() =>
            onChangeAction({ templateMode: Mode.Existing })
          }
          onNewAction={() =>
            onChangeAction({
              templateMode: Mode.New,
              title: request.title,
              description: request.note,
              priceInput: "",
            })
          }
        />
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
            request.lineItemTemplateId && viewModel.canReadTemplates
              ? content.form.templateUnavailable
              : undefined
          }
          errorMessage={
            !viewModel.canReadTemplates
              ? content.form.noCatalogAccess
              : unavailable
                ? content.form.noTemplate
                : undefined
          }
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
