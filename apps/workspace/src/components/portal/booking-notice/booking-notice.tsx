import {
  BOOKING_PROVIDER_NAMES,
  BookingProvider,
} from "@invessiv/common/constants/portal/booking-providers";
import type { PortalBookingDto } from "@invessiv/common/contracts/portal/portal-booking.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import styles from "./booking-notice.module.css";

export type BookingNoticeProps = {
  booking: PortalBookingDto;
  /** The booking link points here through `aria-describedby`. */
  id: string;
  texts: {
    noticeNamed: string;
    noticeOther: string;
  };
};

/** Names the calendar provider before anyone follows the booking link to it. */
export function BookingNotice({ booking, id, texts }: BookingNoticeProps) {
  return (
    <p className={styles.notice} id={id}>
      {booking.provider === BookingProvider.Other
        ? texts.noticeOther
        : formatMessage(texts.noticeNamed, {
            provider: BOOKING_PROVIDER_NAMES[booking.provider],
          })}
    </p>
  );
}
