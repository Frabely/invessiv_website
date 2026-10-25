import Link from "next/link";
import { PrimaryCtaLink, SecondaryCtaLink } from "@invessiv/ui";
import styles from "./portal-invitation-actions.module.css";

export type PortalInvitationActionsProps = {
  ariaLabel: string;
  signInHref: string;
  signInLabel: string;
  signUpHref: string;
  signUpLabel: string;
};

/** Sign-up leads: most invited contacts have no account yet, so it carries the primary style. */
export function PortalInvitationActions({
  ariaLabel,
  signInHref,
  signInLabel,
  signUpHref,
  signUpLabel,
}: PortalInvitationActionsProps) {
  return (
    <nav aria-label={ariaLabel} className={styles.actions}>
      <PrimaryCtaLink linkComponent={Link} href={signUpHref}>
        {signUpLabel}
      </PrimaryCtaLink>
      <SecondaryCtaLink linkComponent={Link} href={signInHref}>
        {signInLabel}
      </SecondaryCtaLink>
    </nav>
  );
}
