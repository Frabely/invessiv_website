import { useId } from "react";
import Link from "next/link";
import type { PortalBookingDto } from "@invessiv/common/contracts/portal/portal-booking.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import type { PortalOnboardingDictionary } from "@/i18n/dictionaries/portal";
import styles from "./onboarding-booking-card.module.css";
import { BookingLink } from "@/components/portal/booking-link/booking-link";

export type OnboardingBookingCardProps = {
  /** Null when nobody who answers for the project offers a link; the team then gets in touch. */
  booking: PortalBookingDto | null;
  /** The company's chat page; null without `portal.messages.read`. */
  chatHref: string | null;
  /** Inside a dashboard widget: a line under the status instead of a section of the page. */
  compact?: boolean;
  texts: PortalOnboardingDictionary["call"];
};

/**
 * How the customer gets to the onboarding call. With a link the provider and the purpose are
 * named first and the calendar opens in a new tab on the click — nothing of the provider is
 * loaded before that, no script and no frame. Without a link the card says that the team will
 * get in touch. The server decides when the call is due; this card only shows it.
 */
export function OnboardingBookingCard({
  booking,
  chatHref,
  compact = false,
  texts,
}: OnboardingBookingCardProps) {
  const headingId = useId();
  const Heading = compact ? "h3" : "h2";

  return (
    <section
      aria-labelledby={headingId}
      className={styles.call}
      data-compact={compact ? "true" : undefined}
    >
      <Heading className={styles.heading} id={headingId}>
        {texts.heading}
      </Heading>
      {booking ? (
        <>
          <p className={styles.text}>
            {formatMessage(texts.booking.text, {
              name: booking.memberDisplayName,
            })}
          </p>
          <BookingLink booking={booking} primary texts={texts.booking} />
        </>
      ) : (
        <>
          <p className={styles.text}>{texts.fallback.text}</p>
          {chatHref ? (
            <Link className={styles.action} href={chatHref}>
              {texts.fallback.chat}
            </Link>
          ) : null}
        </>
      )}
    </section>
  );
}
