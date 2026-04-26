import type { LandingSolutionGraphicContent } from "@/i18n/dictionaries/landing/solution";
import styles from "./solution-graphic.module.css";

type SolutionGraphicProps = {
  content: LandingSolutionGraphicContent;
};

export function SolutionGraphic({ content }: SolutionGraphicProps) {
  return (
    <div className={styles.graphic} data-reveal-item="true" aria-hidden="true">
      <div className={styles.browser}>
        <div className={styles.browserTopbar}>
          <span className={styles.windowDots}>
            <span />
            <span />
            <span />
          </span>
          <span className={styles.addressBar} />
        </div>

        <div className={styles.browserHero}>
          <div className={styles.browserCopy}>
            <span className={styles.miniLabel}>{content.browserLabel}</span>
            <strong>{content.heroTitle}</strong>
            <span className={styles.copyLineWide} />
            <span className={styles.copyLine} />
            <span className={styles.blueButton}>
              {content.buttonLabel}
              <span aria-hidden="true">-&gt;</span>
            </span>
          </div>

          <div className={styles.imageCard}>
            <span className={styles.imageLine} />
            <span className={styles.imageLineShort} />
            <span className={styles.imageSun} />
            <span className={styles.imageMountain} />
          </div>
        </div>

        <div className={styles.valueGroup}>
          <span className={styles.miniLabel}>{content.valueLabel}</span>
          <div className={styles.valueTiles}>
            {content.valueTiles.map((tile, index) => (
              <div className={styles.valueTile} key={tile}>
                <span className={styles.valueIcon} data-icon-index={index} />
                <strong>{tile}</strong>
                <span />
                <span />
              </div>
            ))}
          </div>
        </div>

        <div className={styles.trustPanel}>
          <span className={styles.miniLabel}>{content.trustLabel}</span>
          <div className={styles.trustContent}>
            <span className={styles.avatarRow}>
              <span />
              <span />
              <span />
              <span />
              <span />
            </span>
            <span className={styles.ratingBlock}>
              <span className={styles.stars}>
                <span />
                <span />
                <span />
                <span />
                <span />
              </span>
              <span>{content.rating}</span>
            </span>
          </div>
        </div>
      </div>

      <span className={styles.flowLine} />

      <div className={styles.formCard}>
        <span className={styles.miniLabel}>{content.formLabel}</span>
        <strong>{content.formTitle}</strong>
        <div className={styles.formFields}>
          {content.formFields.map((field, index) => (
            <span
              className={
                index === content.formFields.length - 1
                  ? styles.textarea
                  : undefined
              }
              key={field}
            >
              {field}
            </span>
          ))}
        </div>
        <span className={styles.submitButton}>
          {content.formButton}
          <span aria-hidden="true">-&gt;</span>
        </span>
        <span className={styles.security}>{content.formSecurity}</span>
      </div>

      <div className={styles.timeline}>
        {content.steps.map((step, index) => (
          <span
            className={
              index === content.steps.length - 1 ? styles.activeStep : undefined
            }
            key={step}
          >
            <i />
            {step}
          </span>
        ))}
      </div>
    </div>
  );
}
