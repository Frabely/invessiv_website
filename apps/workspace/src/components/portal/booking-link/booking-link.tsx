import { useId } from "react";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  BOOKING_PROVIDER_NAMES,
  BookingProvider,
} from "@invessiv/common/constants/portal/booking-providers";
import type { PortalBookingDto } from "@invessiv/common/contracts/portal/portal-booking.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import styles from "./booking-link.module.css";

export type BookingLinkProps = {
  booking: PortalBookingDto;
  texts: {
    action: string;
    noticeNamed: string;
    noticeOther: string;
    newTab: string;
  };
  primary?: boolean;
};

export function BookingLink({
  booking,
  texts,
  primary = false,
}: BookingLinkProps) {
  const noticeId = useId();

  return (
    <div className={styles.root}>
      <p className={styles.notice} id={noticeId}>
        {booking.provider === BookingProvider.Other
          ? texts.noticeOther
          : formatMessage(texts.noticeNamed, {
              provider: BOOKING_PROVIDER_NAMES[booking.provider],
            })}
      </p>
      <a
        aria-describedby={noticeId}
        className={styles.action}
        data-primary={primary ? "true" : undefined}
        href={booking.bookingUrl}
        rel="noopener noreferrer"
        target="_blank"
      >
        {texts.action}
        <FontAwesomeIcon aria-hidden="true" icon={faArrowUpRightFromSquare} />
        <span className="sr-only"> ({texts.newTab})</span>
      </a>
    </div>
  );
}
