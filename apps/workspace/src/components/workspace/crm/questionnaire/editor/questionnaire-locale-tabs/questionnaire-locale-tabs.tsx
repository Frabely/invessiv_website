"use client";

import {
  SUPPORTED_LOCALES,
  type Locale,
} from "@invessiv/common/contracts/i18n/locale";
import { TabList } from "@invessiv/ui";
import { languageName } from "@invessiv/common/patterns/i18n/language-name";
import type { CrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./questionnaire-locale-tabs.module.css";

export type QuestionnaireLocaleTabsProps = {
  activeLocale: Locale;
  content: CrmQuestionnaireDictionary["editor"]["locales"];
  /** Prefix of the tab ids; the panel is labelled by `${idPrefix}-${locale}`. */
  idPrefix: string;
  interfaceLocale: Locale;
  missing: readonly Locale[];
  onSelectAction: (locale: Locale) => void;
  panelId: string;
};

/** One tab per supported locale; a missing one says so in text, not only by colour. */
export function QuestionnaireLocaleTabs({
  activeLocale,
  content,
  idPrefix,
  interfaceLocale,
  missing,
  onSelectAction,
  panelId,
}: QuestionnaireLocaleTabsProps) {
  return (
    <TabList
      activeValue={activeLocale}
      ariaLabel={content.ariaLabel}
      className={styles.tabs}
      items={SUPPORTED_LOCALES.map((locale) => {
        const name = languageName(locale, interfaceLocale);
        const isMissing = missing.includes(locale);
        return {
          value: locale,
          id: `${idPrefix}-${locale}`,
          panelId,
          label: (
            <span className={styles.label}>
              {name}
              {isMissing ? (
                <span className={styles.missing}>{content.missing}</span>
              ) : null}
            </span>
          ),
          title: isMissing ? content.missingDescription : undefined,
        };
      })}
      onSelectAction={onSelectAction}
    />
  );
}
