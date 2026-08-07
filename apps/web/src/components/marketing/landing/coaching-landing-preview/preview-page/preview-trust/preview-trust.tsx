import { LandingPreviewAnchor } from "@/common/constants/marketing";
import type { LandingCoachingPreviewContent } from "@/common/contracts/marketing";
import styles from "./preview-trust.module.css";

type PreviewTrustProps = {
  content: LandingCoachingPreviewContent;
};

export function PreviewTrust({ content }: PreviewTrustProps) {
  return (
    <div
      className={styles.trustBlock}
      data-testid="coaching-preview-trust-block"
    >
      <div
        className={styles.statement}
        data-preview-anchor={LandingPreviewAnchor.Trust}
      >
        <p className={styles.quote}>{content.quote}</p>
        <p className={styles.quoteAuthor}>{content.quoteAuthor}</p>
      </div>
    </div>
  );
}
