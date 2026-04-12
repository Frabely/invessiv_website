"use client";

import styles from "./contact-helper-list.module.css";

type ContactHelperListProps = {
  items: string[];
};

export function ContactHelperList({ items }: ContactHelperListProps) {
  if (!items.length) {
    return null;
  }

  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <li className={styles.item} key={item}>
          <span aria-hidden="true" className={styles.marker}>
            ✓
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
