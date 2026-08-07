import Image from "next/image";

import { LandingPreviewAnchor } from "@/common/constants/marketing";
import type { LandingCoachingPreviewContent } from "@/common/contracts/marketing";
import styles from "./preview-hero.module.css";

type PreviewHeroProps = {
  content: LandingCoachingPreviewContent;
};

export function PreviewHero({ content }: PreviewHeroProps) {
  return (
    <div className={styles.hero} data-testid="coaching-preview-hero">
      <div className={styles.copy}>
        <p className={styles.brand}>{content.brand}</p>

        <div
          className={styles.headline}
          data-preview-anchor={LandingPreviewAnchor.Headline}
        >
          <p className={styles.kicker}>{content.kicker}</p>
          <p className={styles.title}>{content.title}</p>
        </div>

        <p className={styles.description}>{content.description}</p>

        <span
          className={styles.cta}
          data-preview-anchor={LandingPreviewAnchor.Cta}
          data-testid="coaching-preview-cta"
        >
          {content.cta}
        </span>
      </div>

      <div className={styles.imageWrap}>
        <Image
          alt={content.imageAlt}
          className={styles.image}
          fill
          priority
          sizes="(max-width: 900px) 88vw, (max-width: 1400px) 34vw, 480px"
          src="/assets/landing-page/coaching-preview-v1.png"
        />
      </div>
    </div>
  );
}
