"use client";

import { useId } from "react";
import { faAddressCard, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ButtonSize } from "@invessiv/common/constants/ui/button-sizes";
import { ButtonVariant } from "@invessiv/common/constants/ui/button-variants";
import { WidgetOpenMode } from "@invessiv/common/constants/ui/widget-open-modes";
import type { PortalContactDto } from "@invessiv/common/contracts/portal/portal-contact.dto";
import { ButtonLink, Widget } from "@invessiv/ui";
import { PORTAL_WIDGET_ACCENTS } from "@/common/constants/portal/portal-widget-accents";
import { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";
import { getMemberInitials } from "@/common/patterns/access/member-initials";
import type { PortalDashboardDictionary } from "@/i18n/dictionaries/portal";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { BookingLink } from "@/components/portal/booking-link/booking-link";
import { BookingNotice } from "@/components/portal/booking-notice/booking-notice";
import styles from "./portal-contact-widget.module.css";

export type PortalContactWidgetProps = {
  contact: PortalContactDto;
  content: PortalDashboardDictionary["widgets"]["contact"];
};

export function PortalContactWidget({
  contact,
  content,
}: PortalContactWidgetProps) {
  const bookingNoticeId = useId();

  return (
    <Widget
      accent={PORTAL_WIDGET_ACCENTS[PortalWidgetKey.Contact]}
      footer={
        <>
          <ButtonLink
            aria-label={formatMessage(content.mailLabel, {
              name: contact.displayName,
            })}
            href={`mailto:${contact.email}`}
            size={ButtonSize.Icon}
            title={content.mail}
            variant={ButtonVariant.Ghost}
          >
            <FontAwesomeIcon aria-hidden="true" icon={faEnvelope} />
          </ButtonLink>
          {contact.booking ? (
            <BookingLink
              booking={contact.booking}
              iconOnly
              noticeId={bookingNoticeId}
              texts={content.booking}
            />
          ) : null}
        </>
      }
      icon={faAddressCard}
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
      {contact.booking ? (
        <div className={styles.booking}>
          <BookingNotice
            booking={contact.booking}
            id={bookingNoticeId}
            texts={content.booking}
          />
        </div>
      ) : null}
    </Widget>
  );
}
