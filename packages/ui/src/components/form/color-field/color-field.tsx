"use client";

import type { ReactNode } from "react";
import { faPalette } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { isHexColor } from "@invessiv/common/patterns/validation/is-hex-color";
import { FormField } from "../form-field/form-field";
import styles from "./color-field.module.css";

// What the native picker opens with while the text holds no valid colour yet.
const PICKER_FALLBACK = "#000000";

export type ColorFieldProps = {
  errorMessage?: string;
  hint?: ReactNode;
  /** DOM id of the hex input; the label and a jump to the field point here. */
  id: string;
  label: string;
  onBlurAction?: () => void;
  /** Typed text, valid or not; the caller decides when to check it. */
  onChangeAction: (value: string) => void;
  /** A colour chosen in the picker, always a valid hex value. */
  onPickAction: (value: string) => void;
  /** Visible text of the button that opens the picker. */
  pickerActionLabel: string;
  /** Accessible name of the picker, naming the field it belongs to. */
  pickerLabel: string;
  placeholder?: string;
  required?: boolean;
  reserveErrorSpace?: boolean;
  value: string;
};

/**
 * A colour as hex text with its preview chip at the start and a labelled picker button next to
 * it. Chip and button open the same native picker; until the text is a valid colour the chip shows
 * a hatched "empty" pattern instead of the picker's fallback black.
 */
export function ColorField({
  errorMessage,
  hint,
  id,
  label,
  onBlurAction,
  onChangeAction,
  onPickAction,
  pickerActionLabel,
  pickerLabel,
  placeholder,
  required = false,
  reserveErrorSpace,
  value,
}: ColorFieldProps) {
  const pickerId = `${id}-picker`;
  const color = value.trim();
  const valid = isHexColor(color);

  return (
    <FormField
      errorMessage={errorMessage}
      hint={hint}
      inputAction={
        <label className={styles.pickerAction} htmlFor={pickerId}>
          <FontAwesomeIcon aria-hidden="true" icon={faPalette} />
          <span className={styles.pickerActionText}>{pickerActionLabel}</span>
        </label>
      }
      inputPrefix={
        <input
          aria-label={pickerLabel}
          className={styles.swatch}
          data-empty={valid ? undefined : "true"}
          id={pickerId}
          onChange={(event) => onPickAction(event.target.value)}
          type="color"
          value={valid ? color : PICKER_FALLBACK}
        />
      }
      inputProps={{
        "aria-required": required,
        autoCapitalize: "characters",
        autoComplete: "off",
        id,
        maxLength: 7,
        onBlur: onBlurAction,
        onChange: (event) => onChangeAction(event.target.value),
        placeholder,
        spellCheck: false,
        value,
      }}
      kind={FormFieldKind.Text}
      label={label}
      required={required}
      reserveErrorSpace={reserveErrorSpace}
    />
  );
}
