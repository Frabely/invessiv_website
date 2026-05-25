"use client";

import type { CSSProperties } from "react";
import { PrimaryCtaLink } from "@/components/shared/button/button";
import { SECTION_HREFS } from "@/config/navigation/home";
import type { PrimaryServiceCardData } from "@/common/contracts/marketing";

import { ServiceActionCta } from "../service-action-cta/service-action-cta";
import { ServiceCardIcon } from "../service-card-icon";
import styles from "../services-section.module.css";

type SelectedServiceProps = {
  ctaLabel: string;
  ctaProjectGoal: string;
  defaultDeliveryLabel: string;
  detailHref?: string;
  detailPageCtaLabel: string;
  recommendedBadgeLabel: string;
  selectedCard: PrimaryServiceCardData;
};

const CALENDAR_ICON_MASK_STYLE = {
  WebkitMaskImage: 'url("/services/calender-icon.svg")',
  maskImage: 'url("/services/calender-icon.svg")',
} satisfies CSSProperties;

export function SelectedService({
  ctaLabel,
  ctaProjectGoal,
  defaultDeliveryLabel,
  detailHref,
  detailPageCtaLabel,
  recommendedBadgeLabel,
  selectedCard,
}: SelectedServiceProps) {
  const selectedDeliveryLabel =
    selectedCard.deliveryLabel ?? defaultDeliveryLabel;
  const selectedDescription = selectedCard.description;
  const timelineItems =
    selectedCard.timeline ?? selectedCard.included.slice(0, 3);

  return (
    <article
      aria-label={selectedCard.title}
      className={styles.activeService}
      data-card-key={selectedCard.key}
      data-service-card="true"
      data-service-variant="active"
    >
      <div className={styles.activeMain}>
        <div className={styles.activeHeading}>
          <ServiceCardIcon
            iconAlt={selectedCard.iconAlt}
            iconSrc={selectedCard.iconSrc}
          />
          <div className={styles.activeHeadingText}>
            <p className={styles.activeEyebrow}>{recommendedBadgeLabel}</p>
            <h3 className={styles.activeTitle}>
              <span>
                {selectedCard.title}
                <span aria-hidden="true" className={styles.titleDot}>
                  .
                </span>
              </span>
            </h3>
          </div>
        </div>

        <div className={styles.activeSummary}>
          {selectedDescription ? (
            <p className={styles.activeDescription}>{selectedDescription}</p>
          ) : null}

          <ul className={styles.bulletList}>
            {selectedCard.included.slice(0, 4).map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </div>
      </div>

      <aside className={styles.activeAside}>
        <div className={styles.timeBlock}>
          <div className={styles.timeHeader}>
            <span aria-hidden="true" className={styles.timeIcon}>
              <span
                className={styles.timeIconImage}
                style={CALENDAR_ICON_MASK_STYLE}
              />
            </span>
            <div className={styles.timeText}>
              <p className={styles.timeLabel}>{selectedDeliveryLabel}</p>
              <p className={styles.timeValue}>{selectedCard.delivery}</p>
            </div>
          </div>
          <p className={styles.timeSteps}>{timelineItems.join(" → ")}</p>
        </div>

        <div className={styles.actionRow}>
          <PrimaryCtaLink
            className={styles.primaryCta}
            data-analytics-event="cta_click"
            data-analytics-location="pricing"
            data-analytics-target="form"
            data-analytics-variant="primary"
            data-project-goal={ctaProjectGoal}
            data-project-offer={selectedCard.key}
            href={SECTION_HREFS.contact}
          >
            {ctaLabel}
          </PrimaryCtaLink>

          {detailHref ? (
            <ServiceActionCta href={detailHref}>
              {detailPageCtaLabel}
            </ServiceActionCta>
          ) : null}
        </div>
      </aside>
    </article>
  );
}
