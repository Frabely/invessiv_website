import type { LandingPricingCard } from "@/i18n/dictionaries/landing/pricing";
import styles from "./pricing-section.module.css";

type PricingCardProps = {
  content: LandingPricingCard;
};

export function PricingCard({ content }: PricingCardProps) {
  const {
    durationLabel,
    durationValue,
    items,
    itemsLabel,
    planDescription,
    planTitle,
    priceLabel,
    priceValue,
  } = content;

  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        <h3 className={styles.planTitle}>{planTitle}</h3>
        <p className={styles.planDescription}>{planDescription}</p>
      </header>

      <div className={styles.cardBody}>
        <p className={styles.itemsLabel}>{itemsLabel}</p>
        <ul className={styles.itemList} aria-label={itemsLabel}>
          {items.map((item, index) => (
            <li className={styles.item} key={item}>
              <span aria-hidden="true" className={styles.itemNumber}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className={styles.itemLabel}>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <footer className={styles.cardFooter}>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>{durationLabel}</span>
          <span className={styles.summaryValue}>{durationValue}</span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>{priceLabel}</span>
          <span className={`${styles.summaryValue} ${styles.priceValue}`}>
            {priceValue}
          </span>
        </div>
      </footer>
    </article>
  );
}
