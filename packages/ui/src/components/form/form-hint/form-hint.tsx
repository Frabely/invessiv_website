import type { ReactNode } from "react";
import styles from "./form-hint.module.css";

export type FormHintProps = {
  children: ReactNode;
  className?: string;
  /** Referenced by `aria-describedby` of the control the hint explains. */
  id?: string;
};

/** The explanation below a control; one look for every kind of field. */
export function FormHint({ children, className, id }: FormHintProps) {
  return (
    <small
      className={className ? `${styles.hint} ${className}` : styles.hint}
      id={id}
    >
      {children}
    </small>
  );
}
