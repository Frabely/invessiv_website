import { LandingPreviewAnchor } from "@/common/constants/marketing";
import type { LandingCoachingPreviewContent } from "@/common/contracts/marketing";
import styles from "./preview-offer.module.css";

type PreviewOfferProps = {
  content: LandingCoachingPreviewContent;
};

export function PreviewOffer({ content }: PreviewOfferProps) {
  return (
    <div
      className={styles.offerBlock}
      data-testid="coaching-preview-offer-block"
    >
      <div
        className={styles.offerCard}
        data-preview-anchor={LandingPreviewAnchor.Offer}
      >
        <p className={styles.offerTitle}>{content.offerTitle}</p>
        <ul className={styles.offerList}>
          {content.offerItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className={styles.offerNote}>{content.offerNote}</p>
      </div>
    </div>
  );
}
