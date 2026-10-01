import { type ReactNode, useId } from "react";
import { FormFieldLabel } from "@invessiv/ui";
import styles from "./onboarding-option-group.module.css";

export type OnboardingOptionGroupProps = {
  /** The options, each a label wrapping its own input. */
  children: ReactNode;
  /** Shown below the options, e.g. a way to clear the selection. */
  footer?: ReactNode;
  help: string | null;
  label: string;
  required: boolean;
};

/** The frame every choice question shares: the question as legend, its help, then the options. */
export function OnboardingOptionGroup({
  children,
  footer,
  help,
  label,
  required,
}: OnboardingOptionGroupProps) {
  const helpId = useId();

  return (
    <fieldset
      aria-describedby={help ? helpId : undefined}
      className={styles.group}
    >
      <legend className={styles.legend}>
        <FormFieldLabel label={label} required={required} />
      </legend>
      {help ? (
        <p className={styles.help} id={helpId}>
          {help}
        </p>
      ) : null}
      <div className={styles.options}>{children}</div>
      {footer}
    </fieldset>
  );
}
