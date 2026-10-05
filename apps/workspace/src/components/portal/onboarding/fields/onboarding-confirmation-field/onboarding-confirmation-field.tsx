"use client";

import { useId } from "react";
import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import { OptionTileKind } from "@invessiv/common/constants/ui/option-tile-kinds";
import type { QuestionnaireResolvedField } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-resolved-field";
import { FormFieldLabel, FormHint, OptionTile } from "@invessiv/ui";
import styles from "./onboarding-confirmation-field.module.css";

export type OnboardingConfirmationFieldProps = {
  checked: boolean;
  field: QuestionnaireResolvedField;
  /** DOM id of the checkbox; a jump to this field focuses it. */
  id: string;
  onChangeAction: (checked: boolean) => void;
};

/** One statement the customer confirms with a tick; the statement itself is the label. */
export function OnboardingConfirmationField({
  checked,
  field,
  id,
  onChangeAction,
}: OnboardingConfirmationFieldProps) {
  const helpId = useId();
  const required = field.requirement === QuestionnaireFieldRequirement.Required;

  return (
    <div className={styles.field}>
      <OptionTile
        aria-describedby={field.help ? helpId : undefined}
        aria-required={required}
        checked={checked}
        id={id}
        kind={OptionTileKind.Checkbox}
        onChange={(event) => onChangeAction(event.target.checked)}
      >
        <FormFieldLabel label={field.label} required={required} />
      </OptionTile>
      {field.help ? <FormHint id={helpId}>{field.help}</FormHint> : null}
    </div>
  );
}
