import type { LandingCoachingPreviewContent } from "@/common/contracts/marketing";
import styles from "./preview-trust.module.css";

type PreviewTrustProps = {
  content: LandingCoachingPreviewContent;
};

/** Renders the supporting quote block, which intentionally has no anchor. */
export function PreviewTrust({ content }: PreviewTrustProps) {
  return (
    <div
      className={styles.trustBlock}
      data-testid="coaching-preview-trust-block"
    >
      <div className={styles.statement}>
        <p className={styles.quote}>{content.quote}</p>
        <p className={styles.quoteAuthor}>{content.quoteAuthor}</p>
      </div>
    </div>
  );
}
