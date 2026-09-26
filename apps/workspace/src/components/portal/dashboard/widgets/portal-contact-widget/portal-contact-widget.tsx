import { faEnvelope, faHeadset } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { WidgetOpenMode } from "@invessiv/common/constants/ui/widget-open-modes";
import type { PortalContactDto } from "@invessiv/common/contracts/portal/portal-contact.dto";
import { Widget } from "@invessiv/ui";
import { getMemberInitials } from "@/common/patterns/access/member-initials";
import type { PortalDashboardDictionary } from "@/i18n/dictionaries/portal";
import { formatMessage } from "@/lib/i18n/format-message";
import styles from "./portal-contact-widget.module.css";

export type PortalContactWidgetProps = {
  contact: PortalContactDto;
  content: PortalDashboardDictionary["widgets"]["contact"];
};

export function PortalContactWidget({
  contact,
  content,
}: PortalContactWidgetProps) {
  return (
    <Widget
      icon={faHeadset}
      openMode={WidgetOpenMode.None}
      title={content.title}
    >
      <div className={styles.person}>
        <span aria-hidden="true" className={styles.avatar}>
          {getMemberInitials(contact.displayName)}
        </span>
        <span className={styles.identity}>
          <span className={styles.name}>{contact.displayName}</span>
          <span className={styles.email}>{contact.email}</span>
        </span>
      </div>
      <a
        aria-label={formatMessage(content.mailLabel, {
          name: contact.displayName,
        })}
        className={styles.mail}
        href={`mailto:${contact.email}`}
      >
        <FontAwesomeIcon aria-hidden="true" icon={faEnvelope} />
        {content.mail}
      </a>
    </Widget>
  );
}
