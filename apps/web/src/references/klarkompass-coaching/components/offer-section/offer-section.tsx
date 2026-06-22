"use client";

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
  mockLabel: string;
};

export function OfferSection({
  ctaHref,
  ctaLabel,
  description,
  eyebrow,
  id,
  includes,
  includesLabel,
  mockLabel,
  noPriceNote,
  suitable,
  suitableLabel,
  title,
}: OfferSectionProps) {
  return (
    <RevealGroup as="section" className={styles.section} id={id}>
      <Reveal as="div" className={styles.card}>
        <div className={styles.header}>
          <KlarkompassEyebrow>{eyebrow}</KlarkompassEyebrow>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.description}>{description}</p>
        </div>

        <div className={styles.lists}>
          <div className={styles.listBlock}>
            <p className={styles.listLabel}>{includesLabel}</p>
            <ul className={styles.list}>
              {includes.map((item) => (
                <li className={styles.listItem} key={item}>
                  <span className={styles.check} aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.listBlock}>
            <p className={styles.listLabel}>{suitableLabel}</p>
            <ul className={styles.list}>
              {suitable.map((item) => (
                <li className={styles.listItem} key={item}>
                  <span className={styles.check} aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.footer}>
          <KlarkompassCta
            href={ctaHref}
            label={ctaLabel}
            mockLabel={mockLabel}
          />
          <p className={styles.noPrice}>{noPriceNote}</p>
        </div>
      </Reveal>
    </RevealGroup>
  );
}
