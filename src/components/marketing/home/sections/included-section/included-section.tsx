import { SectionScanPoints } from "@/components/marketing/home/shared/section-scan-points/section-scan-points";

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
    <section className="included-section" id={id}>
      <h2>{includedContent.title}</h2>
      <SectionScanPoints
        fallbackClassName="included-hint"
        points={includedContent.summaryPoints}
      />

      <div className="included-cards" role="list">
        {includedContent.cards.map((card) => (
          <article className="included-card" key={card.title} role="listitem">
            <div className="included-card-head">
              <h3>{card.title}</h3>
              <span className="included-badge">
                <i aria-hidden="true" />
                {card.tag}
              </span>
            </div>
            <p>{card.description}</p>
          </article>
        ))}
      </div>

      {includedContent.bridge ? (
        <p className="included-bridge">{includedContent.bridge}</p>
      ) : null}
    </section>
  );
}
