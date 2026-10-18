import { type ReactNode, useId } from "react";
import Link from "next/link";
import { faComments, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ButtonSize } from "@invessiv/common/constants/ui/button-sizes";
import { ButtonVariant } from "@invessiv/common/constants/ui/button-variants";
import type { PortalContactDto } from "@invessiv/common/contracts/portal/portal-contact.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonLink } from "@invessiv/ui";
import { BookingLink } from "@/components/portal/booking-link/booking-link";
import { BookingNotice } from "@/components/portal/booking-notice/booking-notice";
import type { PortalFeedbackDictionary } from "@/i18n/dictionaries/portal";
import styles from "./feedback-contact-ways.module.css";

export type FeedbackContactWaysProps = {
  /** Chat page; null without chat access. */
  chatHref: string | null;
  /** Names the chat button for the situation, e.g. arranging a call. */
  chatLabel: string;
  /** The responsible member with mail and, if offered, booking link; null without one. */
  contact: PortalContactDto | null;
  content: PortalFeedbackDictionary;
  /** A way that leads the row, e.g. requesting a further round. */
  leading?: ReactNode;
};

/**
 * Every way to reach us from the feedback page in one row: chat, a call in the calendar of the
 * responsible member, and an email to them. The provider notice stands below the row, so it is
 * read before the calendar opens and never squeezes between the buttons.
 */
export function FeedbackContactWays({
  chatHref,
  chatLabel,
  contact,
  content,
  leading = null,
}: FeedbackContactWaysProps) {
  const noticeId = useId();
  const booking = contact?.booking ?? null;
  if (!leading && !chatHref && !contact) return null;

  return (
    <div className={styles.ways}>
      <div className={styles.row}>
        {leading}
        {chatHref ? (
          <ButtonLink
            href={chatHref}
            linkComponent={Link}
            size={ButtonSize.Control}
            variant={ButtonVariant.Ghost}
          >
            <FontAwesomeIcon aria-hidden="true" icon={faComments} />
            {chatLabel}
          </ButtonLink>
        ) : null}
        {booking ? (
          <BookingLink
            booking={booking}
            noticeId={noticeId}
            texts={content.contact.booking}
          />
        ) : null}
        {contact ? (
          <ButtonLink
            aria-label={formatMessage(content.contact.mailLabel, {
              name: contact.displayName,
            })}
            href={`mailto:${contact.email}`}
            size={ButtonSize.Control}
            variant={ButtonVariant.Ghost}
          >
            <FontAwesomeIcon aria-hidden="true" icon={faEnvelope} />
            {content.contact.mail}
          </ButtonLink>
        ) : null}
      </div>
      {booking ? (
        <BookingNotice
          booking={booking}
          id={noticeId}
          texts={content.contact.booking}
        />
      ) : null}
    </div>
  );
}
