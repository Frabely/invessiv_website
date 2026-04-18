"use client";

import styles from "./contact-form-status.module.css";

type ContactFormStatusProps = {
  message?: string | null;
};

export function ContactFormStatus({ message }: ContactFormStatusProps) {
  if (!message) {
    return null;
  }

  return (
    <p className={styles.status} role="status">
      {message}
    </p>
  );
}
