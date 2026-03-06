import { SectionScanPoints } from "@/components/marketing/home/shared/section-scan-points/section-scan-points";

type ProofContent = {
  cards: Array<{ description: string; tag: string; title: string }>;
  hint: string;
  kpis: Array<{ label: string; suffix: string; value: string }>;
  summaryPoints?: string[];
  title: string;
};

type ProofSectionProps = {
  id: string;
  proofContent: ProofContent;
};

export function ProofSection({ id, proofContent }: ProofSectionProps) {
  return (
    <section className="proof-section" id={id}>
      <h2>{proofContent.title}</h2>
      <SectionScanPoints
        fallbackClassName="proof-hint"
        fallbackText={proofContent.hint}
        points={proofContent.summaryPoints}
      />

      <div className="proof-metrics" role="list">
        {proofContent.kpis.map((metric) => (
          <article
            className="proof-metric-card"
            key={metric.label}
            role="listitem"
          >
            <div className="proof-metric-value">
              <span>{metric.value}</span>
              <span>{metric.suffix}</span>
            </div>
            <p className="proof-metric-label">{metric.label}</p>
          </article>
        ))}
      </div>

      <div className="proof-cards" role="list">
        {proofContent.cards.map((card) => (
          <article className="proof-card" key={card.title} role="listitem">
            <div className="proof-card-head">
              <h3>{card.title}</h3>
              <span className="proof-badge">
                <i aria-hidden="true" />
                {card.tag}
              </span>
            </div>
            <p>{card.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
