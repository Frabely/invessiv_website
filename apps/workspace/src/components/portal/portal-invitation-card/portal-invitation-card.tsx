import type { ReactNode } from "react";
import styles from "./portal-invitation-card.module.css";

export type PortalInvitationCardProps = {
  body: string;
  children: ReactNode;
  eyebrow: string;
  /** Small print below the actions, e.g. what the portal keeps in the browser. */
  note?: string;
  title: string;
};

/** The single, centered gate every invite link renders before a `PortalActor` exists. */
export function PortalInvitationCard({
  body,
  children,
  eyebrow,
  note,
  title,
}: PortalInvitationCardProps) {
  return (
    <main className={styles.page} id="main-content">
      <div className={styles.card}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.body}>{body}</p>
        <div className={styles.actions}>{children}</div>
        {note ? <p className={styles.note}>{note}</p> : null}
      </div>
    </main>
  );
}
