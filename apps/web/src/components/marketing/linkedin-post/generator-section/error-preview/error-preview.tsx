import type { LinkedInPostGeneratorContent } from "@/i18n/dictionaries/linkedin-post/generator";
import styles from "./error-preview.module.css";

/**
 * Resolved failure state of the generator preview. `data-state="error"` is kept
 * as a semantic marker (also asserted against by the limit-reached test).
 */
export function ErrorPreview({
  content,
}: {
  content: LinkedInPostGeneratorContent;
}) {
  const { error } = content.preview;
  return (
    <div className={styles.error} data-state="error" role="alert">
      <div className={styles.frame}>
        <div className={styles.body}>
          <p className={styles.mark} aria-hidden="true">
            ⌗ ERROR
          </p>
          <h3 className={styles.headline}>{error.headline}</h3>
          <p className={styles.copy}>{error.body}</p>
        </div>
      </div>
    </div>
  );
}
