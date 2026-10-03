import Link from "next/link";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./portal-back-link.module.css";

export type PortalBackLinkProps = { href: string; label: string };

export function PortalBackLink({ href, label }: PortalBackLinkProps) {
  return (
    <Link className={styles.link} href={href}>
      <FontAwesomeIcon aria-hidden="true" icon={faArrowLeft} />
      {label}
    </Link>
  );
}
