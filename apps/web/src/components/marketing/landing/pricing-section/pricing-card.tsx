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
    planLabel,
    planTitle,
  } = content;

  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        <span className={styles.planBadge}>{planLabel}</span>
        <h3 className={styles.planTitle}>{planTitle}</h3>
        <p className={styles.planDescription}>{planDescription}</p>
      </header>

      <div className={styles.cardBody}>
        <p className={styles.itemsLabel}>{itemsLabel}</p>
        <ul className={styles.itemList} aria-label={itemsLabel}>
          {items.map((item) => (
            <li className={styles.item} key={item}>
              <span aria-hidden="true" className={styles.itemCheck}>
                <svg
                  fill="none"
                  height="14"
                  viewBox="0 0 24 24"
                  width="14"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 12.5l4.2 4 9.3-9.5"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.4"
                  />
                </svg>
              </span>
              <span className={styles.itemLabel}>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <footer className={styles.cardFooter}>
        <div className={styles.duration}>
          <span aria-hidden="true" className={styles.durationIcon}>
            <svg
              fill="none"
              height="18"
              viewBox="0 0 24 24"
              width="18"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="12"
                cy="12"
                r="8.25"
                stroke="currentColor"
                strokeWidth="1.7"
              />
              <path
                d="M12 7.75V12l2.75 1.75"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
              />
            </svg>
          </span>
          <span className={styles.durationText}>
            <span className={styles.durationLabel}>{durationLabel}</span>
            <span className={styles.durationValue}>{durationValue}</span>
          </span>
        </div>
      </footer>
    </article>
  );
}
