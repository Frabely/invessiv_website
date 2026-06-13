import type { ConsentCategory } from "@/common/constants/consent/consent-category";
import type { ConsentCategoryCopy } from "@/i18n/dictionaries/shared/consent";
import styles from "./consent-toggle-item.module.css";

type ConsentToggleItemProps = {
  category: ConsentCategory;
  checked: boolean;
  copy: ConsentCategoryCopy;
  onToggle: (category: ConsentCategory) => void;
};

export function ConsentToggleItem({
  category,
  checked,
  copy,
  onToggle,
}: ConsentToggleItemProps) {
  return (
    <li className={styles.item}>
      <label className={styles.label}>
        <input
          checked={checked}
          className={styles.input}
          onChange={() => {
            onToggle(category);
          }}
          type="checkbox"
        />
        <span aria-hidden="true" className={styles.switch} />
        <span className={styles.text}>
          <span className={styles.title}>{copy.title}</span>
          <span className={styles.description}>{copy.description}</span>
        </span>
      </label>
    </li>
  );
}
