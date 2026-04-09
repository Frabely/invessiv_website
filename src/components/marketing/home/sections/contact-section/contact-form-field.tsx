"use client";

import type { ReactNode } from "react";
import { ContactFieldLabel } from "@/components/marketing/home/sections/contact-section/contact-field-label";
import styles from "./contact-form-field.module.css";

type ContactFormFieldProps = {
  children: ReactNode;
  errorMessage?: string;
  hint?: ReactNode;
  label: string;
  required?: boolean;
};

export function ContactFormField({
  children,
  errorMessage,
  hint,
  label,
  required = false,
}: ContactFormFieldProps) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>
        <ContactFieldLabel label={label} required={required} />
      </span>
      <span className={styles.control}>{children}</span>
      {hint ? <small className={styles.hint}>{hint}</small> : null}
      {errorMessage ? (
        <small className={styles.error} role="alert">
          {errorMessage}
        </small>
      ) : null}
    </label>
  );
}
