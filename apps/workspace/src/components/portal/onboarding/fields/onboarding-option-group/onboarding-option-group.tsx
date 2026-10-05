import type { ReactNode } from "react";
import { FormFieldset } from "@invessiv/ui";
import styles from "./onboarding-option-group.module.css";

export type OnboardingOptionGroupProps = {
  /** The options, each an `OptionTile`. */
  children: ReactNode;
  /** Shown below the options, e.g. a way to clear the selection. */
  footer?: ReactNode;
  help: string | null;
  label: string;
  required: boolean;
};

/**
 * The frame every choice question shares: the question, the options side by side where there is
 * room, then its help, below the control like the hint of a text input.
 */
export function OnboardingOptionGroup({
  children,
  footer,
  help,
  label,
  required,
}: OnboardingOptionGroupProps) {
  return (
    <FormFieldset
      footer={footer ? <div className={styles.footer}>{footer}</div> : null}
      hint={help ?? undefined}
      label={label}
      required={required}
    >
      <div className={styles.options}>{children}</div>
    </FormFieldset>
  );
}
