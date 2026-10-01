import { faLanguage } from "@fortawesome/free-solid-svg-icons";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { BadgeTone } from "@invessiv/common/constants/ui/badge-tones";
import { Badge } from "@invessiv/ui";
import { languageList } from "@invessiv/common/patterns/i18n/language-name";

type QuestionnaireMissingLocaleBadgeProps = {
  /** Supported locales without text; nothing renders when it is empty. */
  missing: readonly Locale[];
  interfaceLocale: Locale;
  /** `Fehlt: {languages}` from the dictionary. */
  template: string;
};

/** A hint, not an error: the portal falls back to the first maintained language. */
export function QuestionnaireMissingLocaleBadge({
  missing,
  interfaceLocale,
  template,
}: QuestionnaireMissingLocaleBadgeProps) {
  if (missing.length === 0) return null;
  return (
    <Badge
      icon={faLanguage}
      kind="status"
      label={formatMessage(template, {
        languages: languageList(missing, interfaceLocale),
      })}
      tone={BadgeTone.Warning}
    />
  );
}
