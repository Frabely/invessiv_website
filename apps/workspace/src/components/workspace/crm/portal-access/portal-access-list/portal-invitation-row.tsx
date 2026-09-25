import { ButtonControl } from "@invessiv/ui";
import type { PortalInvitationDto } from "@invessiv/common/contracts/crm/portal-invitation.dto";
import type { Locale } from "@/config/i18n";
import type { CrmPortalAccessDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatMessage } from "@/lib/i18n/format-message";
import styles from "./portal-access-list.module.css";

export interface PortalInvitationRowProps {
  invitation: PortalInvitationDto;
  contactName: string;
  roleNames: string;
  busy: boolean;
  content: CrmPortalAccessDictionary;
  locale: Locale;
  onReinvite: () => void;
  onRevoke: () => void;
}

export function PortalInvitationRow({
  invitation,
  contactName,
  roleNames,
  busy,
  content,
  locale,
  onReinvite,
  onRevoke,
}: PortalInvitationRowProps) {
  return (
    <li className={styles.row}>
      <div>
        <strong>{contactName}</strong>
        <p className={styles.status}>
          {invitation.expired ? content.expired : content.pending}
        </p>
        <p>{roleNames}</p>
        <p>
          {formatMessage(content.expires, {
            date: new Date(invitation.expiresAt).toLocaleDateString(locale),
          })}
        </p>
      </div>
      <div className={styles.actions}>
        <ButtonControl type="button" onClick={onReinvite}>
          {content.reinvite}
        </ButtonControl>
        <ButtonControl
          type="button"
          disabled={busy}
          onClick={onRevoke}
          variant="ghost"
        >
          {content.revokeInvitation}
        </ButtonControl>
      </div>
    </li>
  );
}
