"use client";

import type { ReactNode } from "react";
import { SectionScanPoints } from "@/components/marketing/home/shared/section-scan-points/section-scan-points";
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
            {subtitle ? (
              <SectionScanPoints
                className={styles.summaryPoints}
                points={[subtitle]}
              />
            ) : null}
            <p className={styles.intro}>{intro}</p>
          </div>
          {meta ? <div className={styles.meta}>{meta}</div> : null}
        </div>
        <div className={styles.body}>{children}</div>
        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </div>
    </div>
  );
}
