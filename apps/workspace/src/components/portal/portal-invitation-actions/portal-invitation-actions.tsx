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
      <a className={styles.primary} href={signUpHref}>
        {signUpLabel}
      </a>
      <a className={styles.secondary} href={signInHref}>
        {signInLabel}
      </a>
    </nav>
  );
}
