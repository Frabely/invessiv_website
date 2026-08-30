import { CONTACT_CHANNEL_MODES } from "@/config/navigation/home";
import styles from "./qna-contact-cta.module.css";

type QnaContactCtaProps = {
  hint: string;
  href: string;
  label: string;
};

export function QnaContactCta({ hint, href, label }: QnaContactCtaProps) {
  return (
    <p className={styles.cta}>
      <span className={styles.hint}>{hint}</span>
      <a
        className={styles.link}
        data-analytics-event="contact_click"
        data-analytics-location="qna"
        data-analytics-target={CONTACT_CHANNEL_MODES.Email}
        href={href}
      >
        {label}
      </a>
    </p>
  );
}
