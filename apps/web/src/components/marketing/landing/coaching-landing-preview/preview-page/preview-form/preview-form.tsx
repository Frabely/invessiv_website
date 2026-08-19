import { LandingPreviewAnchor } from "@/common/constants/marketing";
import type { LandingCoachingPreviewContent } from "@/common/contracts/marketing";
import { PreviewCta } from "../preview-cta/preview-cta";
import styles from "./preview-form.module.css";

type PreviewFormProps = {
  content: LandingCoachingPreviewContent;
};

export function PreviewForm({ content }: PreviewFormProps) {
  return (
    <div className={styles.formBlock} data-testid="coaching-preview-form-block">
      <p className={styles.formTitle}>{content.formTitle}</p>

      <div
        className={styles.formFields}
        data-preview-anchor={LandingPreviewAnchor.Form}
      >
        <span className={styles.formField}>{content.formNameLabel}</span>
        <span className={styles.formField}>{content.formEmailLabel}</span>
        <div className={styles.formAction}>
          <PreviewCta label={content.cta} />
        </div>
      </div>
    </div>
  );
}
