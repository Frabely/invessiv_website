import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";

import styles from "./trust-outcome-bridge-section.module.css";

type TrustOutcomeBridgeContent = {
  bridge: string;
  kicker: string;
  signalAriaLabel: string;
  summaryPoints: string[];
  title: string;
};

type TrustOutcomeBridgeSectionProps = {
  content: TrustOutcomeBridgeContent;
  id: string;
};

export function TrustOutcomeBridgeSection({
  content,
  id,
}: TrustOutcomeBridgeSectionProps) {
  return (
    <section aria-labelledby={`${id}-title`} className={styles.section} id={id}>
      <div className={styles.copy}>
        <EyebrowPill className={styles.kicker}>{content.kicker}</EyebrowPill>
        <h2 className={styles.title} id={`${id}-title`}>
          {content.title}
        </h2>
        <p className={styles.bridge}>{content.bridge}</p>
      </div>

      <ol aria-label={content.signalAriaLabel} className={styles.signals}>
        {content.summaryPoints.map((point) => (
          <li className={styles.signal} key={point}>
            <span className={styles.signalMarker} aria-hidden="true" />
            <span>{point}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
