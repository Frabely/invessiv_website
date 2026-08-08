import type { LandingPreviewAnchor } from "@/common/constants/marketing";
import styles from "./preview-cta.module.css";

type PreviewCtaProps = {
  anchor?: LandingPreviewAnchor;
  label: string;
};

/** The demo page's only action — identical wherever it repeats. */
export function PreviewCta({ anchor, label }: PreviewCtaProps) {
  return (
    <span
      className={styles.cta}
      data-preview-anchor={anchor}
      data-testid="coaching-preview-cta"
    >
      {label}
    </span>
  );
}
