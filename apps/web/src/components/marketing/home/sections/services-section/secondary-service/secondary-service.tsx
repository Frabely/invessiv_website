"use client";

import { ServiceCardIcon } from "../service-card-icon";
import type { PrimaryServiceCardData } from "@/common/contracts/marketing";
import styles from "../services-section.module.css";

type SecondaryServiceProps = {
  card: PrimaryServiceCardData;
  defaultDeliveryLabel: string;
  isSelected: boolean;
  onSelectAction: (cardKey: PrimaryServiceCardData["key"]) => void;
};

export function SecondaryService({
  card,
  defaultDeliveryLabel,
  isSelected,
  onSelectAction,
}: SecondaryServiceProps) {
  const rowDeliveryLabel = card.deliveryLabel ?? defaultDeliveryLabel;

  return (
    <div
      className={styles.serviceRowShell}
      data-card-key={card.key}
      data-selected={isSelected ? "true" : "false"}
      data-service-variant="alternative"
      role="listitem"
    >
      <button
        aria-pressed={isSelected}
        className={styles.serviceRowButton}
        onClick={() => onSelectAction(card.key)}
        type="button"
      >
        <div className={styles.serviceRow}>
          <span className={styles.rowIconTitle}>
            <ServiceCardIcon iconAlt={card.iconAlt} iconSrc={card.iconSrc} />
            <span className={styles.rowText}>
              <span className={styles.rowTitle}>{card.title}</span>
              <span className={styles.rowDescription}>
                {card.description ?? card.fit}
              </span>
            </span>
          </span>
          <span className={styles.rowMeta}>
            {rowDeliveryLabel}: {card.delivery}
          </span>
        </div>
      </button>
    </div>
  );
}
