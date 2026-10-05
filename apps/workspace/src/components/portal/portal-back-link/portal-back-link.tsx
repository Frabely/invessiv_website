import Link from "next/link";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./portal-back-link.module.css";

export type PortalBackLinkProps = {
  /** Full wording when the visible `label` is a short form of it. */
  ariaLabel?: string;
  href: string;
  label: string;
};

export function PortalBackLink({
  ariaLabel,
  href,
  label,
}: PortalBackLinkProps) {
  return (
    <Link aria-label={ariaLabel} className={styles.link} href={href}>
      <FontAwesomeIcon aria-hidden="true" icon={faArrowLeft} />
      {label}
    </Link>
  );
}
