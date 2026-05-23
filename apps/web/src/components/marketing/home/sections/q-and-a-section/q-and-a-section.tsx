import type {
  QnaItemCopy,
  QnaSecondaryContactCopy,
} from "@/i18n/dictionaries/marketing/home";
import { QAndAAccordion } from "@/components/marketing/home/shared/q-and-a-accordion/q-and-a-accordion";
import { CONTACT_CHANNEL_MODES } from "@/config/navigation/home";
import styles from "./q-and-a-section.module.css";

type QnaItem = QnaItemCopy;
type QnaSecondaryContact = QnaSecondaryContactCopy;

type QAndASectionProps = {
  description: string;
  id: string;
  items: QnaItem[];
  secondaryContact?: QnaSecondaryContact;
  title: string;
};

export function QAndASection({
  description,
  id,
  items,
  secondaryContact,
  title,
}: QAndASectionProps) {
  return (
    <section className={styles.section} id={id}>
      <div className={styles.inner}>
        <div className={styles.overview}>
          <h2 className={styles.title}>{title}</h2>
          {description ? (
            <p className={styles.description}>{description}</p>
          ) : null}

          {secondaryContact ? (
            <aside className={styles.contactCard}>
              <p className={styles.contactHint}>{secondaryContact.hint}</p>
              <a
                className={styles.secondaryContactLink}
                href={secondaryContact.href}
                data-analytics-event="contact_click"
                data-analytics-location="qna"
                data-analytics-target={CONTACT_CHANNEL_MODES.Email}
              >
                {secondaryContact.label}
              </a>
            </aside>
          ) : null}
        </div>

        <div className={styles.board}>
          <QAndAAccordion ariaLabel={title} id={id} items={items} />
        </div>
      </div>
    </section>
  );
}
