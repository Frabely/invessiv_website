import { SectionScanPoints } from "@/components/marketing/home/shared/section-scan-points/section-scan-points";
import styles from "./included-section.module.css";

type IncludedContent = {
  bridge?: string;
  cards: Array<{ description: string; tag: string; title: string }>;
  summaryPoints?: string[];
  title: string;
};

type IncludedSectionProps = {
  id: string;
  includedContent: IncludedContent;
};

export function IncludedSection({ id, includedContent }: IncludedSectionProps) {
  return (
    <section className={styles.section} id={id}>
      <h2 className={styles.title}>{includedContent.title}</h2>
      <SectionScanPoints
        fallbackClassName={styles.hint}
        points={includedContent.summaryPoints}
      />

      <div className={styles.cards} role="list">
        {includedContent.cards.map((card) => (
          <article className={styles.card} key={card.title} role="listitem">
            <div className={styles.cardHead}>
              <h3 className={styles.cardTitle}>{card.title}</h3>
            </div>
            <p className={styles.cardDescription}>{card.description}</p>
          </article>
        ))}
      </div>

      {includedContent.bridge ? (
        <p className={styles.bridge}>{includedContent.bridge}</p>
      ) : null}
    </section>
  );
}
