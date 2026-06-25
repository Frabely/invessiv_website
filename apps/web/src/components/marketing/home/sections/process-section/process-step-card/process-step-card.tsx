import type { ProcessStepCopy } from "@/i18n/dictionaries/marketing/home";
import styles from "./process-step-card.module.css";

type ProcessStepCardProps = {
  index: number;
  step: ProcessStepCopy;
  total: number;
};

export function ProcessStepCard({ index, step, total }: ProcessStepCardProps) {
  // The journey node hangs off the gutter-facing edge: left for every card
  // except the last, which the connector approaches from its right.
  const side = index === total - 1 ? "right" : "left";

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
