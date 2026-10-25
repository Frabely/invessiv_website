import type { LandingPricingCard } from "@/i18n/dictionaries/landing/pricing";
import styles from "./pricing-section.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { faClock } from "@fortawesome/free-regular-svg-icons";

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
                <FontAwesomeIcon icon={faCheck} />
              </span>
              <span className={styles.itemLabel}>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <footer className={styles.cardFooter}>
        <div className={styles.duration}>
          <span aria-hidden="true" className={styles.durationIcon}>
            <FontAwesomeIcon icon={faClock} />
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
