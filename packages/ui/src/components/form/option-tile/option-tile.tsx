"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { OptionTileKind } from "@invessiv/common/constants/ui/option-tile-kinds";
import { CheckboxControl } from "../../checkbox-control/checkbox-control";
import { RadioControl } from "../../radio-control/radio-control";
import styles from "./option-tile.module.css";

export type OptionTileProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "children" | "className" | "type"
> & {
  /** The wording of the option; the whole tile is its click target. */
  children: ReactNode;
  className?: string;
  kind: OptionTileKind;
};

/**
 * One option as a tile as high as a text input: a radio or a checkbox with its wording. The
 * remaining props go to the native input.
 */
export const OptionTile = forwardRef<HTMLInputElement, OptionTileProps>(
  function OptionTile({ children, className, kind, ...inputProps }, ref) {
    const Control =
      kind === OptionTileKind.Radio ? RadioControl : CheckboxControl;

    return (
      <label
        className={className ? `${styles.tile} ${className}` : styles.tile}
      >
        <Control {...inputProps} ref={ref} />
        <span className={styles.text}>{children}</span>
      </label>
    );
  },
);
