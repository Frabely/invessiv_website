"use client";

import type { KeyboardEvent } from "react";

import { ServiceCardIcon } from "@/components/marketing/home/sections/services-section/service-card-icon";
import type { LandingSectionCopy } from "@/i18n/dictionaries/marketing/home";

import styles from "./secondary-service.module.css";

type SecondaryServiceCard = NonNullable<
  LandingSectionCopy["serviceCards"]
>[number];

type SecondaryServiceProps = {
  addonBadgeLabel: string;
  card: SecondaryServiceCard;
  ctaLabel?: string;
  isCtaActive?: boolean;
  ctaProjectGoal?: string;
  defaultDeliveryLabel: string;
  isSelected?: boolean;
  onSelectAction: () => void;
};

export function SecondaryService({
  addonBadgeLabel,
  card,
  ctaLabel,
  isCtaActive = false,
  ctaProjectGoal = "",
  defaultDeliveryLabel,
  isSelected = false,
  onSelectAction,
}: SecondaryServiceProps) {
  const deliveryLabel = card.deliveryLabel ?? defaultDeliveryLabel;

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    onSelectAction();
  };

  return (
    <article
      aria-label={card.title}
      className={styles.card}
      data-card-key={card.key}
      data-selected={isSelected ? "true" : "false"}
      data-service-variant="secondary"
      onClick={onSelectAction}
      onKeyDown={handleKeyDown}
      role="listitem"
      tabIndex={0}
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
          <span className={styles.metaChip}>{card.price}</span>
          <span className={styles.metaChip}>
            {deliveryLabel}: {card.delivery}
          </span>
        </div>
      </div>

      <div className={styles.copy}>
        <p className={styles.description}>{card.description}</p>
        {card.fit ? <p className={styles.fit}>{card.fit}</p> : null}
        {ctaLabel ? (
          <div className={styles.ctaSlot}>
            {isCtaActive ? (
              <a
                className={styles.ctaLink}
                data-analytics-event="cta_click"
                data-analytics-location="pricing"
                data-analytics-target="form"
                data-analytics-variant="secondary-link"
                data-project-goal={ctaProjectGoal}
                data-project-offer={card.key}
                href="#contact"
              >
                {ctaLabel}
              </a>
            ) : (
              <span
                aria-hidden="true"
                className={`${styles.ctaLink} ${styles.ctaLinkPlaceholder}`}
              >
                {ctaLabel}
              </span>
            )}
          </div>
        ) : null}
      </div>
    </article>
  );
}
