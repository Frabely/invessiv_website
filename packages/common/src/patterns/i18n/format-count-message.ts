import type { CountMessageTemplates } from "../../contracts/i18n/count-message-templates";
import { formatMessage } from "./format-message";

function pickTemplate(count: number, templates: CountMessageTemplates) {
  if (count === 0 && templates.none !== undefined) return templates.none;
  if (count === 1) return templates.one;
  return templates.many;
}

/** Picks the none/one/many template for a count and fills in `{count}`. */
export function formatCountMessage(
  count: number,
  templates: CountMessageTemplates,
): string {
  return formatMessage(pickTemplate(count, templates), { count });
}
