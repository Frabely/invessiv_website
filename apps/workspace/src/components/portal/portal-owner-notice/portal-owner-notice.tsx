import { faLock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import styles from "./portal-owner-notice.module.css";

export type PortalOwnerNoticeProps = {
  cockpitHref: string;
  hint: string;
  id: string;
  linkLabel: string;
};

/** Explains why the owner view cannot write here and points to the CRM, where it can. */
export function PortalOwnerNotice({
  cockpitHref,
  hint,
  id,
  linkLabel,
}: PortalOwnerNoticeProps) {
  return (
    <p className={styles.notice} id={id}>
      <FontAwesomeIcon aria-hidden="true" icon={faLock} />
      <span>{hint}</span>
      <Link className={styles.link} href={cockpitHref}>
        {linkLabel}
      </Link>
    </p>
  );
}
