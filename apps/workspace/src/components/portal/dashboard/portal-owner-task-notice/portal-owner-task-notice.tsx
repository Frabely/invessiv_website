import { faLock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./portal-owner-task-notice.module.css";

export type PortalOwnerTaskNoticeProps = {
  cockpitHref: string;
  hint: string;
  id: string;
  linkLabel: string;
};

/** Explains the disabled checkboxes of the owner view and points to where the task is completed. */
export function PortalOwnerTaskNotice({
  cockpitHref,
  hint,
  id,
  linkLabel,
}: PortalOwnerTaskNoticeProps) {
  return (
    <p className={styles.notice} id={id}>
      <FontAwesomeIcon aria-hidden="true" icon={faLock} />
      <span>{hint}</span>
      <a className={styles.link} href={cockpitHref}>
        {linkLabel}
      </a>
    </p>
  );
}
