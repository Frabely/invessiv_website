"use client";

import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import type { QuestionnaireResolvedField } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-resolved-field";
import { OptionTileKind } from "@invessiv/common/constants/ui/option-tile-kinds";
import { ButtonSize } from "@invessiv/common/constants/ui/button-sizes";
import { OptionTile, SecondaryCtaButton } from "@invessiv/ui";
import type { PortalOnboardingDictionary } from "@/i18n/dictionaries/portal";
import { OnboardingOptionGroup } from "../onboarding-option-group/onboarding-option-group";

export type OnboardingChoiceFieldProps = {
  field: QuestionnaireResolvedField;
  /** DOM id of the first option; a jump to this field focuses it. */
  id: string;
  onChangeAction: (choiceIds: string[]) => void;
  /** The selected option as a list of at most one id. */
  selected: readonly string[];
  texts: PortalOnboardingDictionary["field"];
};

/** One option out of several, also for yes/no. An optional answer can be taken back. */
export function OnboardingChoiceField({
  field,
  id,
  onChangeAction,
  selected,
  texts,
}: OnboardingChoiceFieldProps) {
  const required = field.requirement === QuestionnaireFieldRequirement.Required;

  return (
    <OnboardingOptionGroup
      footer={
        !required && selected.length > 0 ? (
          <div>
            <SecondaryCtaButton
              onClick={() => onChangeAction([])}
              size={ButtonSize.Control}
              type="button"
            >
              {texts.clearChoice}
            </SecondaryCtaButton>
          </div>
        ) : undefined
      }
      help={field.help}
      label={field.label}
      required={required}
    >
      {field.choices.map((choice, index) => (
        <OptionTile
          checked={selected.includes(choice.id)}
          id={index === 0 ? id : undefined}
          key={choice.id}
          kind={OptionTileKind.Radio}
          name={id}
          onChange={() => onChangeAction([choice.id])}
          required={required}
        >
          {choice.label}
        </OptionTile>
      ))}
    </OnboardingOptionGroup>
  );
}
