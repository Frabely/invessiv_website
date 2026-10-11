import { type ReactNode } from "react";
import { TriState } from "../../constants/filters/tri-state";

export type CustomSelectOption<TValue extends string = string> = {
  value: TValue;
  label: string;
  description?: string;
  /** Visible with its explanation, but cannot be selected. */
  disabled?: boolean;
  ariaLabel?: string;
  leading?: ReactNode;
};

export type CustomMultiSelectOption<TValue extends string = string> =
  CustomSelectOption<TValue> & {
    state: TriState;
  };
