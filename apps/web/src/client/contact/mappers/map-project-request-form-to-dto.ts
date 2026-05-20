import type { ProjectRequestFormValues } from "@invessiv/common/contracts/contact/forms/project-request-form-values";
import type { MapProjectRequestFormToDtoOptions } from "@invessiv/common/contracts/contact/options/map-project-request-form-to-dto-options";
import type { SaveProjectRequestDto } from "@invessiv/common/contracts/contact/project-request/save-project-request-dto";
import type {
  ContactBudgetKey,
  ContactGoalKey,
  ContactPageKey,
  ContactStartKey,
  ContactWorkflowKey,
} from "@invessiv/common/contracts/contact/keys/contact-option-keys";
import { CONTACT_REQUEST_KIND } from "@invessiv/common/constants/contact/contact-request-kind";

function toOptionalTrimmedString(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue || undefined;
}

function toOptionalCustomPageNames(values: string[]) {
  const normalizedValues = values.map((value) => value.trim()).filter(Boolean);

  return normalizedValues.length > 0 ? normalizedValues : undefined;
}

export function mapProjectRequestFormToDto(
  values: ProjectRequestFormValues,
  { locale, startedAt }: MapProjectRequestFormToDtoOptions,
): SaveProjectRequestDto {
  return {
    budgetKey: (values.budgetKey || undefined) as ContactBudgetKey | undefined,
    company: toOptionalTrimmedString(values.company),
    consentAccepted: values.consentAccepted,
    email: values.email.trim(),
    displayName: values.displayName.trim(),
    goalKey: (values.goalKey || undefined) as ContactGoalKey | undefined,
    kind: CONTACT_REQUEST_KIND.ProjectRequest,
    locale,
    offerKey: values.offerKey as SaveProjectRequestDto["offerKey"],
    customPageNames: toOptionalCustomPageNames(values.customPageNames),
    pageKeys:
      values.pageKeys.length > 0
        ? (values.pageKeys as ContactPageKey[])
        : undefined,
    phone: toOptionalTrimmedString(values.phone),
    preferredStartKey: (values.preferredStartKey || undefined) as
      | ContactStartKey
      | undefined,
    projectDetails: values.projectDetails.trim(),
    role: toOptionalTrimmedString(values.role),
    startedAt,
    website: toOptionalTrimmedString(values.website),
    websiteTrap: toOptionalTrimmedString(values.websiteTrap),
    workflowKey: (values.workflowKey || undefined) as
      | ContactWorkflowKey
      | undefined,
  };
}
