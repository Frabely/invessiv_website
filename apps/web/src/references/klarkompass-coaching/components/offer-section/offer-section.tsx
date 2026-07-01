import { KlarkompassCta } from "@/references/klarkompass-coaching/components/klarkompass-cta/klarkompass-cta";
import { KlarkompassEyebrow } from "@/references/klarkompass-coaching/components/klarkompass-eyebrow/klarkompass-eyebrow";
import {
  Reveal,
  RevealGroup,
} from "@/references/klarkompass-coaching/components/klarkompass-reveal/klarkompass-reveal";
import type { Locale } from "@/config/i18n";
import type { KlarkompassOfferContent } from "@/references/klarkompass-coaching/i18n/content";
import styles from "./offer-section.module.css";

type OfferSectionProps = KlarkompassOfferContent & {
  ctaHref: string;
  id: string;
  locale: Locale;
  mockAlertMessage: string;
};

export function OfferSection({
  ctaHref,
  ctaLabel,
  eyebrow,
  id,
  includes,
  includesLabel,
  mockAlertMessage,
  price,
  priceCaption,
  priceLabel,
  priceNote,
  suitable,
  suitableLabel,
  title,
}: OfferSectionProps) {
  return (
    <RevealGroup as="section" className={styles.section} id={id}>
      <Reveal as="div" className={styles.intro}>
        <KlarkompassEyebrow>{eyebrow}</KlarkompassEyebrow>
        <h2 className={styles.title}>{title}</h2>
      </Reveal>

      <Reveal as="div" className={styles.card}>
        <div className={styles.decision}>
          <span aria-hidden="true" className={styles.needle}>
            <svg className={styles.needleSvg} viewBox="0 0 24 24">
              <path className={styles.needleNorth} d="M12 2.5 L15 12 L9 12 Z" />
              <path
                className={styles.needleSouth}
                d="M12 21.5 L9 12 L15 12 Z"
              />
              <circle className={styles.needlePivot} cx="12" cy="12" r="1.7" />
            </svg>
          </span>
          <p className={styles.priceLabel}>{priceLabel}</p>
          <p className={styles.price}>{price}</p>
          <p className={styles.priceCaption}>{priceCaption}</p>
          <div className={styles.ctaWrap}>
            <KlarkompassCta
              href={ctaHref}
              label={ctaLabel}
              mockAlertMessage={mockAlertMessage}
            />
          </div>
          <p className={styles.priceNote}>{priceNote}</p>
        </div>

        <div className={styles.contents}>
          <div className={styles.block}>
            <p className={styles.blockLabel}>{includesLabel}</p>
            <ul className={styles.includes}>
              {includes.map((item) => (
                <li className={styles.includeItem} key={item}>
                  <span aria-hidden="true" className={styles.tick} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.block}>
            <p className={styles.blockLabel}>{suitableLabel}</p>
            <ul className={styles.chips}>
              {suitable.map((item) => (
                <li className={styles.chip} key={item}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
    </RevealGroup>
  );
}
