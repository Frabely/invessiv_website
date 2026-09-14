import {
  faArrowRotateRight,
  faCheck,
  faClock,
  faLock,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { WorkspacePageContent } from "@/i18n/dictionaries/workspace";
import styles from "./workspace-access-status.module.css";

type WorkspaceAccessStatusProps = {
  content: WorkspacePageContent["access"][keyof WorkspacePageContent["access"]];
  retryHref: string;
  variant: "pending" | "restricted";
};

export function WorkspaceAccessStatus({
  content,
  retryHref,
  variant,
}: WorkspaceAccessStatusProps) {
  const isPending = variant === "pending";

  return (
    <section
      aria-labelledby="workspace-access-title"
      className={styles.wrapper}
      data-workspace-page="access-status"
    >
      <div className={styles.card}>
        <div aria-hidden="true" className={styles.iconHalo}>
          <FontAwesomeIcon icon={isPending ? faClock : faLock} />
        </div>

        <div className={styles.copy}>
          <p className={styles.status}>{content.status}</p>
          <p className={styles.eyebrow}>{content.eyebrow}</p>
          <h1 id="workspace-access-title">{content.title}</h1>
          <p className={styles.description}>{content.description}</p>
        </div>

        <ol className={styles.progress} aria-label={content.progressLabel}>
          <li className={styles.progressItem} data-state="complete">
            <span aria-hidden="true" className={styles.progressIcon}>
              <FontAwesomeIcon icon={faCheck} />
            </span>
            <span>
              <strong>{content.accountStep.title}</strong>
              <small>{content.accountStep.description}</small>
            </span>
          </li>
          <li
            className={styles.progressItem}
            data-state={isPending ? "pending" : "restricted"}
          >
            <span aria-hidden="true" className={styles.progressIcon}>
              <FontAwesomeIcon icon={isPending ? faClock : faLock} />
            </span>
            <span>
              <strong>{content.accessStep.title}</strong>
              <small>{content.accessStep.description}</small>
            </span>
          </li>
        </ol>

        <div className={styles.footer}>
          <p>{content.note}</p>
          <a className={styles.retryLink} href={retryHref}>
            <FontAwesomeIcon aria-hidden="true" icon={faArrowRotateRight} />
            {content.retryLabel}
          </a>
        </div>
      </div>
    </section>
  );
}
