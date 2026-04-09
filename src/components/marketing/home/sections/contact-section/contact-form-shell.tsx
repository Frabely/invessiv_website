"use client";

import type { ReactNode } from "react";
import styles from "./contact-form-shell.module.css";

type ContactFormShellProps = {
  children: ReactNode;
  intro: string;
  title: string;
};

export function ContactFormShell({
  children,
  intro,
  title,
}: ContactFormShellProps) {
  return (
    <div className={styles.root}>
      <div className={styles.panel} role="region" aria-label={title}>
        <div className={styles.head}>
          <div className={styles.headCopy}>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.intro}>{intro}</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
