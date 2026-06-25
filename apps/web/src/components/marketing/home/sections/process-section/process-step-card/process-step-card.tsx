import type { ProcessStepCopy } from "@/i18n/dictionaries/marketing/home";
import styles from "./process-step-card.module.css";

type ProcessStepCardProps = {
  index: number;
  step: ProcessStepCopy;
};

export function ProcessStepCard({ index, step }: ProcessStepCardProps) {
  // The journey node hangs off the inner, gutter-facing edge: right-column
  // cards (even index) carry it on the left, left-column cards (odd index)
  // on the right, so the connector runs down the centre.
  const side = index % 2 === 0 ? "left" : "right";

  return (
    <article
      className={styles.card}
      data-journey-state="pending"
      data-process-step="true"
      data-side={side}
    >
      <span className={styles.node} aria-hidden="true">
        <span className={styles.nodeNumber}>{step.step}</span>
      </span>
      <div className={styles.body}>
        <p className={styles.deliverable}>{step.deliverable}</p>
        <h3 className={styles.title}>{step.title}</h3>
        <p className={styles.description}>{step.description}</p>
      </div>
    </article>
  );
}
