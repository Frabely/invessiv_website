import type { ReactNode } from "react";
import styles from "./generator-section.module.css";

type FieldProps = {
  children: ReactNode;
  error?: string;
  help?: string;
  htmlFor: string;
  label: string;
  meta?: string;
};

/** Label + helper/error wrapper around a single generator form control. */
export function Field({
  children,
  error,
  help,
  htmlFor,
  label,
  meta,
}: FieldProps) {
  return (
    <div className={styles.field} data-has-error={Boolean(error) || undefined}>
      <div className={styles.fieldHead}>
        <label className={styles.label} htmlFor={htmlFor}>
          {label}
        </label>
        {meta ? <span className={styles.fieldMeta}>{meta}</span> : null}
      </div>
      {children}
      {error ? (
        <p className={styles.fieldError} id={`${htmlFor}-error`} role="alert">
          {error}
        </p>
      ) : help ? (
        <p className={styles.fieldHelp}>{help}</p>
      ) : null}
    </div>
  );
}
