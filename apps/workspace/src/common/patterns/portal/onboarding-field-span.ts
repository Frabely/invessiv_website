import { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import type { QuestionnaireResolvedField } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-resolved-field";
import { OnboardingFieldSpan } from "@/common/constants/portal/onboarding-field-spans";

// Up to this many options a choice still reads well as one narrow column.
const NARROW_CHOICE_LIMIT = 5;

/**
 * The room a question gets in the form grid. It follows what the control needs to stay readable,
 * so text inputs sit side by side while self-contained questions keep their width. Long text
 * counts as a text input: it opens one line high and grows with what is typed.
 */
export function onboardingFieldSpan(
  field: Pick<QuestionnaireResolvedField, "type" | "choices">,
): OnboardingFieldSpan {
  switch (field.type) {
    case QuestionnaireFieldType.Group:
    case QuestionnaireFieldType.Files:
    case QuestionnaireFieldType.ProjectServices:
      return OnboardingFieldSpan.Full;
    case QuestionnaireFieldType.Scale:
    case QuestionnaireFieldType.Confirmation:
      return OnboardingFieldSpan.Wide;
    case QuestionnaireFieldType.Choice:
    case QuestionnaireFieldType.MultiChoice:
      return field.choices.length > NARROW_CHOICE_LIMIT
        ? OnboardingFieldSpan.Wide
        : OnboardingFieldSpan.Narrow;
    default:
      return OnboardingFieldSpan.Narrow;
  }
}
