import { memo } from "react";

import type { LandingCoachingPreviewContent } from "@/common/contracts/marketing";
import { PreviewForm } from "./preview-form/preview-form";
import { PreviewHero } from "./preview-hero/preview-hero";
import { PreviewOffer } from "./preview-offer/preview-offer";
import { PreviewProblems } from "./preview-problems/preview-problems";
import { PreviewTrust } from "./preview-trust/preview-trust";
import styles from "./preview-page.module.css";

type PreviewPageProps = {
  content: LandingCoachingPreviewContent;
};

/** Renders the demo page whose sections provide the highlight anchors. */
export const PreviewPage = memo(function PreviewPage({
  content,
}: PreviewPageProps) {
  return (
    <div className={styles.page} data-preview-page="true">
      <PreviewHero content={content} />
      <PreviewProblems content={content} />
      <PreviewOffer content={content} />
      <PreviewTrust content={content} />
      <PreviewForm content={content} />
    </div>
  );
});
