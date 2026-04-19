import type { LandingSectionCopy } from "@/i18n/dictionaries/marketing/home";
import { QAndAAccordion } from "@/components/marketing/home/shared/q-and-a-accordion/q-and-a-accordion";
import { SectionScanPoints } from "@/components/marketing/home/shared/section-scan-points/section-scan-points";
import styles from "./q-and-a-section.module.css";

type QnaItem = NonNullable<LandingSectionCopy["qnaItems"]>[number];
type QnaSecondaryContact = NonNullable<
  LandingSectionCopy["qnaSecondaryContact"]
>;

type QAndASectionProps = {
  description: string;
  id: string;
  items: QnaItem[];
  secondaryContact?: QnaSecondaryContact;
  summaryPoints?: string[];
  title: string;
};

export function QAndASection({
  description,
  id,
  items,
  secondaryContact,
  summaryPoints,
  title,
}: QAndASectionProps) {
  return (
    <section className={styles.section} id={id}>
      <div className={styles.inner}>
        <div className={styles.overview}>
          <h2 className={styles.title}>{title}</h2>
          <SectionScanPoints
            ariaLabel={title}
            className={styles.summaryPoints}
            fallbackClassName={styles.hint}
            fallbackText={description}
            points={summaryPoints}
          />
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
                data-analytics-target="email"
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
