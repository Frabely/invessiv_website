import type { CSSProperties } from "react";
import { GeneratorStepStatus } from "@/common/constants/generator/generator-step-status";
import type { LinkedInPostGeneratorContent } from "@/i18n/dictionaries/linkedin-post/generator";
import styles from "./generating-panel.module.css";

type GeneratingPanelProps = {
  content: LinkedInPostGeneratorContent;
  stepIndex: number;
};

function generatorStepStatus(
  index: number,
  activeIndex: number,
): GeneratorStepStatus {
  if (index < activeIndex) {
    return GeneratorStepStatus.Done;
  }
  if (index === activeIndex) {
    return GeneratorStepStatus.Active;
  }
  return GeneratorStepStatus.Pending;
}

/**
 * In-generator loading state: replaces the form in the same centered slot while
 * a post is being built. Compact, card-styled like the form (continuity), it
 * shows an indeterminate progress sweep plus a step list driven by `stepIndex`.
 * Purely presentational — the parent owns the step interval.
 */
export function GeneratingPanel({ content, stepIndex }: GeneratingPanelProps) {
  const { loading } = content.preview;
  const totalSteps = loading.steps.length;
  const currentStep = Math.min(stepIndex + 1, totalSteps);

  return (
    <div
      aria-live="polite"
      className={styles.panel}
      data-state="generating"
      role="status"
    >
      <div className={styles.head}>
        <p className={styles.mark} aria-hidden="true">
          ⌗ 0{currentStep}/0{totalSteps}
        </p>
        <p className={styles.statusPill}>{content.form.submitLoading}</p>
      </div>

      <span aria-hidden="true" className={styles.progressTrack}>
        <span className={styles.progressSweep} />
      </span>

      <h3 className={styles.headline}>{loading.headline}</h3>
      <p className={styles.copy}>{loading.body}</p>

      <ol className={styles.stepsList}>
        {loading.steps.map((step, index) => (
          <li
            className={styles.stepItem}
            data-status={generatorStepStatus(index, stepIndex)}
            key={step}
            style={{ "--step-index": index } as CSSProperties}
          >
            <span aria-hidden="true" className={styles.stepDot} />
            <span>{step}</span>
          </li>
        ))}
      </ol>

      <p className={styles.help}>{content.form.loadingHelp}</p>
    </div>
  );
}
