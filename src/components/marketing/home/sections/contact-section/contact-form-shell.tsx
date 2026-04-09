"use client";

import type { ReactNode } from "react";
import styles from "./contact-form-shell.module.css";

type ContactFormShellProps = {
  children: ReactNode;
  footer?: ReactNode;
  intro: string;
  meta?: ReactNode;
  subtitle?: string;
  title: string;
};

export function ContactFormShell({
  children,
  footer,
  intro,
  meta,
  subtitle,
  title,
}: ContactFormShellProps) {
  return (
    <div className={styles.root}>
      <div className={styles.panel} role="region" aria-label={title}>
        <div className={styles.head}>
          <div className={styles.headCopy}>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.intro}>{intro}</p>
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          </div>
          {meta ? <div className={styles.meta}>{meta}</div> : null}
        </div>
        <div className={styles.body}>{children}</div>
        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </div>
    </div>
  );
}
