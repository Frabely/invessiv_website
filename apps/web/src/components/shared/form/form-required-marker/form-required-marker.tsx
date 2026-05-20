"use client";

import styles from "./form-required-marker.module.css";

type FormRequiredMarkerProps = {
  className?: string;
};

export function FormRequiredMarker({ className }: FormRequiredMarkerProps) {
  const markerClassName = className
    ? `${styles.marker} ${className}`
    : styles.marker;

  return <strong className={markerClassName}>*</strong>;
}
