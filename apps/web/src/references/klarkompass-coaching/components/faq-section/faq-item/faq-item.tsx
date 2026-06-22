import type { KlarkompassFaqItem } from "@/references/klarkompass-coaching/i18n/content";
import styles from "./faq-item.module.css";

type FaqItemProps = {
  contentId: string;
  isOpen: boolean;
  item: KlarkompassFaqItem;
  onToggle: () => void;
  triggerId: string;
};

export function FaqItem({
  contentId,
  isOpen,
  item,
  onToggle,
  triggerId,
}: FaqItemProps) {
  return (
    <div className={styles.item} data-open={isOpen}>
      <h3 className={styles.heading}>
        <button
          aria-controls={contentId}
          aria-expanded={isOpen}
          className={styles.trigger}
          id={triggerId}
          onClick={onToggle}
          type="button"
        >
          <span>{item.question}</span>
          <span className={styles.icon} data-open={isOpen} aria-hidden="true" />
        </button>
      </h3>
      <div
        aria-labelledby={triggerId}
        className={styles.panel}
        hidden={!isOpen}
        id={contentId}
        role="region"
      >
        <p className={styles.answer}>{item.answer}</p>
      </div>
    </div>
  );
}
