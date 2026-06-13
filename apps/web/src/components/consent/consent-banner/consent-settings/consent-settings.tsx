"use client";

import { useState } from "react";
import { ConsentCategory } from "@/common/constants/consent/consent-category";
import { type ConsentChoice } from "@/common/contracts/consent/consent-choice";
import { DEFAULT_CONSENT_CHOICE } from "@/common/defaults/consent/consent-choice";
import { ConsentToggleItem } from "@/components/consent/consent-banner/consent-settings/consent-toggle-item/consent-toggle-item";
import { useConsent } from "@/hooks/consent/use-consent";
import styles from "./consent-settings.module.css";

export function ConsentSettings() {
  const { content, choice, saveChoice } = useConsent();
  const [selection, setSelection] = useState<ConsentChoice>(
    choice ?? DEFAULT_CONSENT_CHOICE,
  );

  const toggleCategory = (category: ConsentCategory) => {
    setSelection((current) => ({
      ...current,
      [category]: !current[category],
    }));
  };

  return (
    <div className={styles.panel}>
      <ul className={styles.list}>
        <li className={styles.necessary}>
          <div className={styles.text}>
            <span className={styles.itemTitle}>
              {content.categories.necessary.title}
            </span>
            <p className={styles.itemDescription}>
              {content.categories.necessary.description}
            </p>
          </div>
          <span className={styles.alwaysOn}>{content.necessaryStateLabel}</span>
        </li>

        <ConsentToggleItem
          category={ConsentCategory.Analytics}
          checked={selection.analytics}
          copy={content.categories.analytics}
          onToggle={toggleCategory}
        />

        <ConsentToggleItem
          category={ConsentCategory.Marketing}
          checked={selection.marketing}
          copy={content.categories.marketing}
          onToggle={toggleCategory}
        />
      </ul>

      <button
        className={styles.save}
        onClick={() => {
          saveChoice(selection);
        }}
        type="button"
      >
        {content.banner.save}
      </button>
    </div>
  );
}
