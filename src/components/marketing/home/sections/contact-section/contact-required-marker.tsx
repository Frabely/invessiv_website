"use client";

import styles from "./contact-required-marker.module.css";

export function ContactRequiredMarker() {
  return <strong className={styles.marker}>*</strong>;
}
