"use client";
import { FormFieldset, OptionTile } from "@invessiv/ui";
import { ServiceRequestProjectWish as Mode } from "@invessiv/common/constants/crm/service-request-project-wishes";
import { OptionTileKind } from "@invessiv/common/constants/ui/option-tile-kinds";
import styles from "./service-request-mode-choice.module.css";

export type ServiceRequestModeChoiceProps = {
  label: string;
  name: string;
  existingLabel: string;
  newLabel: string;
  value: Mode;
  onExistingAction: () => void;
  onNewAction: () => void;
};

/** "Existing or new" as two tiles; rendered only where both ways really exist. */
export function ServiceRequestModeChoice({
  label,
  name,
  existingLabel,
  newLabel,
  value,
  onExistingAction,
  onNewAction,
}: ServiceRequestModeChoiceProps) {
  return (
    <FormFieldset label={label}>
      <div className={styles.choices}>
        <OptionTile
          kind={OptionTileKind.Radio}
          name={name}
          value={Mode.Existing}
          checked={value === Mode.Existing}
          onChange={onExistingAction}
        >
          {existingLabel}
        </OptionTile>
        <OptionTile
          kind={OptionTileKind.Radio}
          name={name}
          value={Mode.New}
          checked={value === Mode.New}
          onChange={onNewAction}
        >
          {newLabel}
        </OptionTile>
      </div>
    </FormFieldset>
  );
}
