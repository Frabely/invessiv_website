import { useId } from "react";
import {
  faArrowUpRightFromSquare,
  faCalendarPlus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ButtonSize } from "@invessiv/common/constants/ui/button-sizes";
import { ButtonVariant } from "@invessiv/common/constants/ui/button-variants";
import type { PortalBookingDto } from "@invessiv/common/contracts/portal/portal-booking.dto";
import { ButtonLink } from "@invessiv/ui";
import { BookingNotice } from "../booking-notice/booking-notice";
import styles from "./booking-link.module.css";

export type BookingLinkProps = {
  booking: PortalBookingDto;
  texts: {
    action: string;
    noticeNamed: string;
    noticeOther: string;
    newTab: string;
  };
  /**
   * Id of a `BookingNotice` rendered elsewhere, e.g. above a card's action row. Without it the
   * notice stands directly above the link.
   */
  noticeId?: string;
  /** Shows a calendar icon instead of the text, which stays as the accessible name and tooltip. */
  iconOnly?: boolean;
  primary?: boolean;
};

export function BookingLink({
  booking,
  texts,
  noticeId,
  iconOnly = false,
  primary = false,
}: BookingLinkProps) {
  const ownNoticeId = useId();
  const describedBy = noticeId ?? ownNoticeId;
  const link = (
    <ButtonLink
      aria-describedby={describedBy}
      aria-label={iconOnly ? `${texts.action} (${texts.newTab})` : undefined}
      data-primary={primary ? "true" : undefined}
      href={booking.bookingUrl}
      rel="noopener noreferrer"
      size={iconOnly ? ButtonSize.Icon : ButtonSize.Control}
      target="_blank"
      title={iconOnly ? texts.action : undefined}
      variant={primary ? ButtonVariant.Primary : ButtonVariant.Ghost}
    >
      {iconOnly ? null : (
        <span>
          {texts.action}
          <span className="sr-only"> ({texts.newTab})</span>
        </span>
      )}
      <FontAwesomeIcon
        aria-hidden="true"
        className={styles.icon}
        icon={iconOnly ? faCalendarPlus : faArrowUpRightFromSquare}
      />
    </ButtonLink>
  );

  if (noticeId) return link;

  return (
    <div className={styles.root}>
      <BookingNotice booking={booking} id={ownNoticeId} texts={texts} />
      {link}
    </div>
  );
}
