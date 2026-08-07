import type { LandingCoachingPreviewContent } from "@/common/contracts/marketing";
import styles from "./preview-problems.module.css";

type PreviewProblemsProps = {
  content: LandingCoachingPreviewContent;
};

/** Renders the supporting problem block, which intentionally has no anchor. */
export function PreviewProblems({ content }: PreviewProblemsProps) {
  return (
    <div
      className={styles.problemBlock}
      data-testid="coaching-preview-problem-block"
    >
      <p className={styles.problemTitle}>{content.problemTitle}</p>
      <ul className={styles.problemList}>
        {content.problems.map((problem) => (
          <li key={problem}>{problem}</li>
        ))}
      </ul>
    </div>
  );
}
