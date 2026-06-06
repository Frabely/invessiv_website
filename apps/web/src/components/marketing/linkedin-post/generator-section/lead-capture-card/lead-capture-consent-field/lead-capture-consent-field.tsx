import type { ChangeEventHandler, ReactNode } from "react";
import { FormRequiredMarker } from "@/components/shared/form/form-required-marker/form-required-marker";
import styles from "./lead-capture-consent-field.module.css";

type LeadCaptureConsentFieldProps = {
  checked: boolean;
  children?: ReactNode;
  error?: string;
  id: string;
  label: string;
  name: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  required?: boolean;
};

export function LeadCaptureConsentField({
  checked,
  children,
  error,
  id,
  label,
  name,
  onChange,
  required = false,
}: LeadCaptureConsentFieldProps) {
  const errorId = `${id}-error`;

  return (
    <>
      <label
        className={styles.consent}
        data-error={Boolean(error) || undefined}
        htmlFor={id}
      >
        <input
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error)}
          checked={checked}
          className={styles.input}
          id={id}
          name={name}
          onChange={onChange}
          required={required}
          type="checkbox"
        />
        <span className={styles.text}>
          <span>
            {label}
            {required ? <FormRequiredMarker /> : null}
          </span>
          {children}
        </span>
      </label>
      {error ? (
        <p className={styles.error} id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
