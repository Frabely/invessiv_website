"use client";

import { ServiceActionCta } from "../service-action-cta/service-action-cta";
import { ServiceCardIcon } from "../service-card-icon";
import { SECTION_HREFS } from "@/config/navigation/home";
import type { MaintenanceServiceCardData } from "@/common/contracts/marketing";
import styles from "./extra-service.module.css";

type ExtraServiceProps = {
  card: MaintenanceServiceCardData;
  ctaLabel: string;
  ctaProjectGoal: string;
  defaultDeliveryLabel: string;
};

export function ExtraService({
  card,
  ctaLabel,
  ctaProjectGoal,
  defaultDeliveryLabel,
}: ExtraServiceProps) {
  return (
    <article
      aria-label={card.title}
      className={styles.card}
      data-card-key={card.key}
      data-service-variant="secondary"
    >
      <div className={styles.maintenanceContent}>
        <div className={styles.maintenanceTitleRow}>
          <h4 className={styles.maintenanceTitle}>
            <ServiceCardIcon iconAlt={card.iconAlt} iconSrc={card.iconSrc} />
            <span>{card.title}</span>
          </h4>
        </div>
        <p className={styles.maintenanceDescription}>{card.description}</p>
        <ServiceActionCta
          data-analytics-event="cta_click"
          data-analytics-location="pricing"
          data-analytics-target="form"
          data-analytics-variant="secondary-link"
          data-project-goal={ctaProjectGoal}
          data-project-offer={card.key}
          href={SECTION_HREFS.contact}
        >
          {ctaLabel}
        </ServiceActionCta>
      </div>
      <div className={styles.maintenanceMeta}>
        <span className={styles.rowMeta}>
          {card.deliveryLabel ?? defaultDeliveryLabel}: {card.delivery}
        </span>
      </div>
    </article>
  );
}
