import Image from "next/image";

import { CONTACT_CHANNEL_KEYS } from "@/common/constants/contact/contact-channel-keys";
import type { Locale } from "@/config/i18n";
import { ContactIdentity } from "@/components/shared/contact-identity/contact-identity";
import portraitPhoto from "@/assets/home/suit-1.jpeg";
import styles from "./contact-portrait-card.module.css";

type ContactPortraitCardProps = {
  imageAlt: string;
  locale: Locale;
  points: string[];
};

export function ContactPortraitCard({
  imageAlt,
  locale,
  points,
}: ContactPortraitCardProps) {
  return (
    <aside className={styles.card}>
      <div className={styles.frame}>
        <Image
          alt={imageAlt}
          className={styles.image}
          loading="lazy"
          sizes="(max-width: 900px) 96px, 260px"
          src={portraitPhoto}
        />
      </div>

      <div className={styles.identity}>
        <ContactIdentity
          analyticsLocation="contact"
          channels={CONTACT_CHANNEL_KEYS}
          locale={locale}
        />
      </div>

      <ul className={styles.points}>
        {points.map((point) => (
          <li className={styles.point} key={point}>
            {point}
          </li>
        ))}
      </ul>
    </aside>
  );
}
