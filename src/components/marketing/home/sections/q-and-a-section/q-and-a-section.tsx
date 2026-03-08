import type { LandingSectionCopy } from "@/i18n/dictionaries/marketing/home";
import { SectionScanPoints } from "@/components/marketing/home/shared/section-scan-points/section-scan-points";

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
    <section className="qna-section" id={id}>
      <h2>{title}</h2>
      <SectionScanPoints
        fallbackClassName="qna-hint"
        fallbackText={description}
        points={summaryPoints}
      />

      <ul aria-label={title} className="qna-list">
        {items.map((item, index) => {
          const questionId = `${id}-question-${index + 1}`;
          return (
            <li className="qna-item" key={questionId}>
              <details className="qna-disclosure">
                <summary className="qna-summary" id={questionId}>
                  <span className="qna-question">{item.question}</span>
                  <span className="qna-arrow" aria-hidden="true">
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
                  className="qna-answer-wrap"
                  role="region"
                >
                  <p className="qna-answer">{item.answer}</p>
                </div>
              </details>
            </li>
          );
        })}
      </ul>

      {secondaryContact ? (
        <p className="qna-secondary-contact">
          <span>{secondaryContact.hint} </span>
          <a
            className="qna-secondary-contact-link"
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
