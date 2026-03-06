import type { LandingSectionCopy } from "@/i18n/dictionaries/marketing/home";
import { SectionScanPoints } from "@/components/marketing/home/shared/section-scan-points/section-scan-points";

type QnaItem = NonNullable<LandingSectionCopy["qnaItems"]>[number];

type QAndASectionProps = {
  description: string;
  id: string;
  items: QnaItem[];
  summaryPoints?: string[];
  title: string;
};

export function QAndASection({
  description,
  id,
  items,
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

      <ul className="qna-list">
        {items.map((item) => (
          <li className="qna-item" key={item.question}>
            <details className="qna-disclosure">
              <summary className="qna-summary">
                <span className="qna-marker" aria-hidden="true">
                  <svg viewBox="0 0 16 16">
                    <path d="M6.3 10.6 3.7 8l-1.1 1.1 3.7 3.7 7-7L12.2 4.7z" />
                  </svg>
                </span>
                <span className="qna-question">{item.question}</span>
                <span className="qna-arrow" aria-hidden="true">
                  <svg viewBox="0 0 16 16">
                    <path d="M6 3.2 10.8 8 6 12.8l1.2 1.2L13.2 8 7.2 2z" />
                  </svg>
                </span>
              </summary>
              <p className="qna-answer">{item.answer}</p>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
