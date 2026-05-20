"use client";

import styles from "./form-status.module.css";

type FormStatusProps = {
  className?: string;
  message?: string | null;
};

export function FormStatus({ className, message }: FormStatusProps) {
  if (!message) {
    return null;
  }

  const statusClassName = className
    ? `${styles.status} ${className}`
    : styles.status;

  return <p className={statusClassName}>{message}</p>;
}
