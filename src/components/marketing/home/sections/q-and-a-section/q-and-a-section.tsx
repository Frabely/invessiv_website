import type { LandingSectionCopy } from "@/i18n/dictionaries/marketing/home";
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
      <h2 className={styles.title}>{title}</h2>
      <SectionScanPoints
        fallbackClassName={styles.hint}
        fallbackText={description}
        points={summaryPoints}
      />

      <ul aria-label={title} className={styles.list}>
        {items.map((item, index) => {
          const questionId = `${id}-question-${index + 1}`;
          return (
            <li className={styles.item} key={questionId}>
              <details className={styles.disclosure}>
                <summary className={styles.summary} id={questionId}>
                  <span className={styles.question}>{item.question}</span>
                  <span className={styles.arrow} aria-hidden="true">
                    <svg viewBox="0 0 16 16">
                      <path
                        d="M4 6.5 8 10.5 12 6.5"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                      />
                    </svg>
                  </span>
                </summary>
                <div
                  aria-labelledby={questionId}
                  className={styles.answerWrap}
                  role="region"
                >
                  <p className={styles.answer}>{item.answer}</p>
                </div>
              </details>
            </li>
          );
        })}
      </ul>

      {secondaryContact ? (
        <p className={styles.secondaryContact}>
          <span>{secondaryContact.hint} </span>
          <a
            className={styles.secondaryContactLink}
            href={secondaryContact.href}
            data-analytics-event="contact_click"
            data-analytics-location="qna"
            data-analytics-target="email"
          >
            {secondaryContact.label}
          </a>
        </p>
      ) : null}
    </section>
  );
}
