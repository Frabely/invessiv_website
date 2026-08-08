import { LandingPreviewAnchor } from "@/common/constants/marketing";
import type { LandingCoachingPreviewContent } from "@/common/contracts/marketing";
import styles from "./preview-problems.module.css";

type PreviewProblemsProps = {
  content: LandingCoachingPreviewContent;
};

export function PreviewProblems({ content }: PreviewProblemsProps) {
  return (
    <div
      className={styles.problemBlock}
      data-testid="coaching-preview-problem-block"
    >
      <div
        className={styles.statement}
        data-preview-anchor={LandingPreviewAnchor.Problems}
      >
        <p className={styles.problemTitle}>{content.problemTitle}</p>
        <ul className={styles.problemList}>
          {content.problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
