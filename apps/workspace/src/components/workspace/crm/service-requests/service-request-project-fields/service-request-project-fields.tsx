"use client";
import { CustomSelect, FormField } from "@invessiv/ui";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { ProjectFieldLimits } from "@invessiv/common/constants/crm/forms/project-field-limits";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ServiceRequestProjectWish as Mode } from "@invessiv/common/constants/crm/service-request-project-wishes";
import type { ServiceRequestDto } from "@invessiv/common/contracts/crm/service-requests/service-request.dto";
import type { CrmServiceRequestsDictionary } from "@/i18n/dictionaries/workspace/crm";
import type { ServiceRequestsViewModel } from "@/common/contracts/crm/service-requests-view-model";
import type { ServiceRequestAcceptFormValues } from "@/common/contracts/crm/service-request-accept-form-values";
import { canChooseServiceRequestProject } from "@/common/patterns/crm/service-requests/service-request-accept-form";
import { isProjectTitleValid } from "@/common/patterns/crm/project-form";
import { ServiceRequestModeChoice } from "../service-request-mode-choice/service-request-mode-choice";

export type ServiceRequestProjectFieldsProps = {
  request: ServiceRequestDto;
  viewModel: ServiceRequestsViewModel;
  content: CrmServiceRequestsDictionary;
  values: ServiceRequestAcceptFormValues;
  unavailable: boolean;
  invalid: boolean;
  onChangeAction: (patch: Partial<ServiceRequestAcceptFormValues>) => void;
};

/** The choice between an existing and a new project only exists where a new one may be created. */
export function ServiceRequestProjectFields({
  request,
  viewModel,
  content,
  values,
  unavailable,
  invalid,
  onChangeAction,
}: ServiceRequestProjectFieldsProps) {
  const canChoose = canChooseServiceRequestProject(request, viewModel);
  return (
    <>
      {canChoose ? (
        <ServiceRequestModeChoice
          label={content.form.project}
          name="service-request-project-mode"
          existingLabel={content.form.existingProject}
          newLabel={content.form.newProject}
          value={values.projectMode}
          onExistingAction={() =>
            onChangeAction({ projectMode: Mode.Existing })
          }
          onNewAction={() => onChangeAction({ projectMode: Mode.New })}
        />
      ) : null}
      {values.projectMode === Mode.Existing ? (
        <FormField
          kind={FormFieldKind.Custom}
          label={
            canChoose ? content.form.existingProject : content.form.project
          }
          required
          errorMessage={
            unavailable
              ? content.form.noProject
              : invalid && !values.projectId
                ? content.form.projectRequired
                : undefined
          }
          renderControl={({ id, describedBy, invalid }) => (
            <CustomSelect
              id={id}
              invalid={invalid}
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
          errorMessage={
            (invalid ||
              values.projectTitle.trim().length >
                ProjectFieldLimits.TitleMaxLength) &&
            !isProjectTitleValid(values.projectTitle)
              ? formatMessage(content.form.projectTitleInvalid, {
                  max: ProjectFieldLimits.TitleMaxLength,
                })
              : undefined
          }
          inputProps={{
            value: values.projectTitle,
            onChange: (e) => onChangeAction({ projectTitle: e.target.value }),
            maxLength: ProjectFieldLimits.TitleMaxLength,
          }}
        />
      )}
    </>
  );
}
