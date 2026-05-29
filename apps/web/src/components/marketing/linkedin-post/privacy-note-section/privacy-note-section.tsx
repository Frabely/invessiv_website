import type { LinkedInPostPrivacyNoteContent } from "@/i18n/dictionaries/linkedin-post/privacy-note";
import styles from "./privacy-note-section.module.css";

type PrivacyNoteSectionProps = LinkedInPostPrivacyNoteContent & {
  id: string;
  privacyHref: string;
};

export function PrivacyNoteSection({
  id,
  eyebrow,
  title,
  body,
  privacyLabel,
  privacyHref,
}: PrivacyNoteSectionProps) {
  return (
    <section aria-labelledby={`${id}-title`} className={styles.section} id={id}>
      <div className={styles.card}>
        <span aria-hidden="true" className={styles.glyph}>
          <span className={styles.glyphInner} />
        </span>
        <div className={styles.body}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h2 className={styles.title} id={`${id}-title`}>
            {title}
          </h2>
          <p className={styles.copy}>{body}</p>
          <a
            className={styles.privacyLink}
            data-analytics-event="privacy_link_click"
            data-analytics-location="generator_privacy_note"
            href={privacyHref}
          >
            {privacyLabel}
            <span aria-hidden="true" className={styles.privacyArrow}>
              →
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
