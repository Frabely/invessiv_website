import { faEye } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { PortalShellDictionary } from "@/i18n/dictionaries/portal";
import styles from "./portal-owner-banner.module.css";

export type PortalOwnerBannerProps = {
  cockpitHref: string;
  companyName: string;
  content: PortalShellDictionary["ownerView"];
};

/** Shown only in the owner's read-only view, so it can never be mistaken for the customer's own session. */
export function PortalOwnerBanner({
  cockpitHref,
  companyName,
  content,
}: PortalOwnerBannerProps) {
  return (
    <aside aria-label={content.label} className={styles.banner}>
      <FontAwesomeIcon
        aria-hidden="true"
        className={styles.icon}
        icon={faEye}
      />
      <p className={styles.text}>
        <span className={styles.title}>
          {content.label} <strong>{companyName}</strong>
        </span>
        <span className={styles.hint}>{content.hint}</span>
      </p>
      <a className={styles.link} href={cockpitHref}>
        {content.cockpitLink}
      </a>
    </aside>
  );
}
