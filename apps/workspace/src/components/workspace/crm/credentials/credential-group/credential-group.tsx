"use client";

import { type ReactNode, useId } from "react";
import styles from "./credential-group.module.css";

type CredentialGroupProps = {
  children: ReactNode[];
  emptyText: string;
  hint?: string;
  title: string;
};

export function CredentialGroup({
  children,
  emptyText,
  hint,
  title,
}: CredentialGroupProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className={styles.group}>
      <div className={styles.groupHead}>
        <h4 className={styles.groupTitle} id={headingId}>
          {title}
        </h4>
        {hint ? <p className={styles.groupHint}>{hint}</p> : null}
      </div>
      {children.length > 0 ? (
        <ul className={styles.list}>{children}</ul>
      ) : (
        <p className={styles.groupEmpty}>{emptyText}</p>
      )}
    </section>
  );
}
