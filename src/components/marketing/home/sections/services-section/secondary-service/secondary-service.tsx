"use client";

import { ServiceCardIcon } from "@/components/marketing/home/sections/services-section/service-card-icon";
import { SECTION_HREFS } from "@/config/site";
import type { LandingSectionCopy } from "@/i18n/dictionaries/marketing/home";

import styles from "./secondary-service.module.css";

type SecondaryServiceCard = NonNullable<
  LandingSectionCopy["serviceCards"]
>[number];

type SecondaryServiceProps = {
  addonBadgeLabel: string;
  card: SecondaryServiceCard;
  ctaLabel: string;
  ctaProjectGoal?: string;
  defaultDeliveryLabel: string;
};

export function SecondaryService({
  addonBadgeLabel,
  card,
  ctaLabel,
  ctaProjectGoal = "",
  defaultDeliveryLabel,
}: SecondaryServiceProps) {
  const deliveryLabel = card.deliveryLabel ?? defaultDeliveryLabel;

  return (
    <article
      aria-label={card.title}
      className={styles.card}
      data-card-key={card.key}
      data-service-variant="secondary"
      role="listitem"
    >
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <h4 className={styles.title}>
            <ServiceCardIcon iconAlt={card.iconAlt} iconSrc={card.iconSrc} />
            <span>{card.title}</span>
          </h4>
          {card.key === "maintenance" ? (
            <span className={styles.badge}>{addonBadgeLabel}</span>
          ) : null}
        </div>

        <div className={styles.metaRow}>
          <span className={styles.highlight}>{card.highlight}</span>
          <span className={styles.metaChip}>
            {deliveryLabel}: {card.delivery}
          </span>
        </div>
      </div>

      <div className={styles.copy}>
        <div className={styles.copyBlock}>
          <p className={styles.description}>{card.description}</p>
          {card.fit ? <p className={styles.fit}>{card.fit}</p> : null}
        </div>
        <p className={styles.pricingHint}>{card.pricingHint}</p>
        <div className={styles.ctaSlot}>
          <a
            className={styles.ctaLink}
            data-analytics-event="cta_click"
            data-analytics-location="pricing"
            data-analytics-target="form"
            data-analytics-variant="secondary-link"
            data-project-goal={ctaProjectGoal}
            data-project-offer={card.key}
            href={SECTION_HREFS.contact}
          >
            {ctaLabel}
          </a>
        </div>
      </div>
    </article>
  );
}
