import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faBug, faPenRuler } from "@fortawesome/free-solid-svg-icons";
import type { FeedbackItemKind } from "@invessiv/common/constants/crm/feedback-item-kinds";

/** Symbol per item kind; the text label always comes along, the symbol never stands alone. */
export const FEEDBACK_ITEM_KIND_ICONS = {
  change_request: faPenRuler,
  bug: faBug,
} as const satisfies Record<FeedbackItemKind, IconDefinition>;
