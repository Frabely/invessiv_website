import type { Locale } from "@/config/i18n";
import type { ProjectRequestDto } from "@/features/contact/client/project-request.dto";
import type { ProjectRequestFormValues } from "@/features/contact/client/project-request-form.schema";
import type {
  ContactBudgetKey,
  ContactGoalKey,
  ContactPageKey,
  ContactStartKey,
  ContactWorkflowKey,
} from "@/features/contact/contact-options";

type MapProjectRequestFormToDtoOptions = {
  locale: Locale;
  startedAt: string;
};

function toOptionalTrimmedString(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue || undefined;
}

export function mapProjectRequestFormToDto(
  values: ProjectRequestFormValues,
  { locale, startedAt }: MapProjectRequestFormToDtoOptions,
): ProjectRequestDto {
  return {
    budgetKey: (values.budgetKey || undefined) as ContactBudgetKey | undefined,
    company: toOptionalTrimmedString(values.company),
    consentAccepted: values.consentAccepted,
    email: values.email.trim(),
    firstName: values.firstName.trim(),
    goalKey: (values.goalKey || undefined) as ContactGoalKey | undefined,
    kind: "project_request",
    lastName: values.lastName.trim(),
    locale,
    offerKey: values.offerKey as ProjectRequestDto["offerKey"],
    pageKeys:
      values.pageKeys.length > 0
        ? (values.pageKeys as ContactPageKey[])
        : undefined,
    pagesCustom: toOptionalTrimmedString(values.pagesCustom),
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
