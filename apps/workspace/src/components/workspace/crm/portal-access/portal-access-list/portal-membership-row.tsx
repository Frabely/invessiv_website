import { ButtonControl } from "@invessiv/ui";
import type { PortalMembershipDto } from "@invessiv/common/contracts/crm/portal-membership.dto";
import type { Locale } from "@/config/i18n";
import type { CrmPortalAccessDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatMessage } from "@/lib/i18n/format-message";
import styles from "./portal-access-list.module.css";

export interface PortalMembershipRowProps {
  membership: PortalMembershipDto;
  contactName: string;
  roleNames: string;
  content: CrmPortalAccessDictionary;
  locale: Locale;
  onEditRoles: () => void;
  onRevoke: () => void;
}

export function PortalMembershipRow({
  membership,
  contactName,
  roleNames,
  content,
  locale,
  onEditRoles,
  onRevoke,
}: PortalMembershipRowProps) {
  const lastSeen = membership.lastSeenAt
    ? formatMessage(content.lastSeen, {
        date: new Date(membership.lastSeenAt).toLocaleDateString(locale),
      })
    : content.neverSeen;
  return (
    <li className={styles.row}>
      <div>
        <strong>{contactName}</strong>
        <p className={styles.status}>{content.active}</p>
        <p>{roleNames}</p>
        <p>{lastSeen}</p>
      </div>
      <div className={styles.actions}>
        <ButtonControl type="button" onClick={onEditRoles}>
          {content.roles}
        </ButtonControl>
        <ButtonControl type="button" onClick={onRevoke} variant="ghost">
          {content.revoke}
        </ButtonControl>
      </div>
    </li>
  );
}
