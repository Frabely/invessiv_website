import { type Locale, SUPPORTED_LOCALES } from "@invessiv/common";
import { OnboardingReleaseWarningKind } from "../../../constants/crm/onboarding/onboarding-release-warning-kinds";
import { QuestionnaireFieldType } from "../../../constants/crm/questionnaire/questionnaire-field-types";
import type { OnboardingReleaseWarningDto } from "../../../contracts/crm/onboarding/onboarding-release-warning.dto";
import type { QuestionnaireBlockDto } from "../../../contracts/crm/questionnaire/questionnaire-block.dto";
import { missingQuestionnaireLocales } from "../questionnaire/questionnaire-translation";

/**
 * Whether a form asks anything at all: at least one block, every block with a field and every
 * group with a sub-field. An empty step would only confuse the customer, so it blocks the release.
 */
export function isOnboardingFormReleasable(
  blocks: readonly QuestionnaireBlockDto[],
): boolean {
  return (
    blocks.length > 0 &&
    blocks.every(
      (block) =>
        block.fields.length > 0 &&
        block.fields.every(
          (field) =>
            field.type !== QuestionnaireFieldType.Group ||
            field.children.length > 0,
        ),
    )
  );
}

/**
 * What the team should know before releasing, in form order. `contactLocales` are the preferred
 * languages of the customer's active portal contacts; without any contact nobody could open the
 * form, and which language is missing does not matter yet.
 */
export function listOnboardingReleaseWarnings(
  blocks: readonly QuestionnaireBlockDto[],
  contactLocales: readonly Locale[],
): OnboardingReleaseWarningDto[] {
  if (contactLocales.length === 0)
    return [{ kind: OnboardingReleaseWarningKind.NoPortalAccess }];
  const wanted = SUPPORTED_LOCALES.filter((locale) =>
    contactLocales.includes(locale),
  );
  return blocks.flatMap((block) => {
    const missing = missingQuestionnaireLocales(block);
    return wanted
      .filter((locale) => missing.includes(locale))
      .map((locale) => ({
        kind: OnboardingReleaseWarningKind.MissingTranslation,
        blockId: block.id,
        locale,
      }));
  });
}
