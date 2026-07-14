"use client";

import Image from "next/image";
import { useRef } from "react";
import type { LandingCoachingPreviewContent } from "@/common/contracts/marketing";
import { useHeroVisualTilt } from "@/hooks/marketing/use-hero-visual-tilt";
import styles from "./coaching-landing-preview.module.css";

type CoachingLandingPreviewProps = {
  content: LandingCoachingPreviewContent;
};

export function CoachingLandingPreview({
  content,
}: CoachingLandingPreviewProps) {
  const browserRef = useRef<HTMLDivElement | null>(null);

  useHeroVisualTilt(browserRef, {
    maximumRotation: 3,
    parallaxDistance: 0,
    restRotation: 0,
  });

  return (
    <aside aria-label={content.ariaLabel} className={styles.visual}>
      <div className={styles.frame}>
        <div
          className={styles.browser}
          data-testid="coaching-preview-browser"
          ref={browserRef}
        >
          <div aria-hidden="true" className={styles.browserBar}>
            <div className={styles.windowControls}>
              <span />
              <span />
              <span />
            </div>
            <div className={styles.addressBar}>
              <span className={styles.lockMark}>•</span>
              <span>{content.browserLabel}</span>
            </div>
            <span className={styles.demoBadge}>{content.demoLabel}</span>
          </div>

          <div className={styles.pagePreview}>
            <div
              className={styles.demoHero}
              data-testid="coaching-preview-hero"
            >
              <div className={styles.demoCopy}>
                <p className={styles.brand}>{content.brand}</p>
                <p className={styles.kicker}>{content.kicker}</p>
                <p className={styles.demoTitle}>{content.title}</p>
                <p className={styles.description}>{content.description}</p>
                <span
                  className={styles.demoCta}
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

            <div
              className={styles.offerBlock}
              data-testid="coaching-preview-offer-block"
            >
              <div className={styles.offerCard}>
                <p className={styles.offerTitle}>{content.offerTitle}</p>
                <ul className={styles.offerList}>
                  {content.offerItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className={styles.offerNote}>{content.offerNote}</p>
              </div>
            </div>

            <div
              className={styles.trustBlock}
              data-testid="coaching-preview-trust-block"
            >
              <p className={styles.quote}>{content.quote}</p>
              <p className={styles.quoteAuthor}>{content.quoteAuthor}</p>
            </div>

            <div
              className={styles.formBlock}
              data-testid="coaching-preview-form-block"
            >
              <p className={styles.formTitle}>{content.formTitle}</p>
              <div className={styles.formFields}>
                <span className={styles.formField}>
                  {content.formNameLabel}
                </span>
                <span className={styles.formField}>
                  {content.formEmailLabel}
                </span>
                <span className={styles.formSubmit}>
                  {content.formSubmitLabel}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
